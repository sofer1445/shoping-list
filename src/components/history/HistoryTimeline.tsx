import { useEffect, useMemo, useState } from "react";
import { RotateCcw, ArchiveRestore, Package } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "@/components/shopping/types";

interface ArchivedList {
  id: string;
  name: string;
  archived_at: string;
  items: ShoppingItem[];
}

interface Props {
  onOpenList: (id: string) => void;
}

export const HistoryTimeline = ({ onOpenList }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<ArchivedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: ls } = await supabase
      .from("shopping_lists")
      .select("id, name, archived_at")
      .eq("archived", true)
      .eq("created_by", user.id)
      .order("archived_at", { ascending: false })
      .limit(60);

    const rows: ArchivedList[] = await Promise.all(
      (ls || []).map(async (l) => {
        const { data: items } = await supabase
          .from("shopping_items")
          .select("*")
          .eq("list_id", l.id);
        return { ...l, items: (items || []) as ShoppingItem[] };
      })
    );
    setLists(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("shopping-list-updated", h);
    return () => window.removeEventListener("shopping-list-updated", h);
  }, [user?.id]);

  const grouped = useMemo(() => {
    const map = new Map<string, ArchivedList[]>();
    lists.forEach((l) => {
      const label = format(new Date(l.archived_at), "MMMM yyyy", { locale: he });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(l);
    });
    return Array.from(map.entries());
  }, [lists]);

  const summary = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const recentLists = lists.filter((l) => new Date(l.archived_at) >= weekAgo);
    const items = recentLists.reduce((s, l) => s + l.items.length, 0);
    return { lists: recentLists.length, items };
  }, [lists]);

  const buyAgain = async (list: ArchivedList) => {
    if (!user) return;
    setBusy(list.id);
    try {
      const { data: newList, error } = await supabase
        .from("shopping_lists")
        .insert({ name: `${list.name} (שוב)`, created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      if (list.items.length > 0) {
        await supabase.from("shopping_items").insert(
          list.items.map((it) => ({
            list_id: newList.id,
            name: it.name,
            quantity: it.quantity,
            category: it.category,
            completed: false,
            created_by: user.id,
          }))
        );
      }
      toast({ title: "רשימה חדשה נוצרה", description: `${list.items.length} פריטים` });
      window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      onOpenList(newList.id);
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const restoreList = async (list: ArchivedList) => {
    setBusy(list.id);
    await supabase
      .from("shopping_lists")
      .update({ archived: false, archived_at: null })
      .eq("id", list.id);
    await supabase
      .from("shopping_items")
      .update({ archived: false, archived_at: null })
      .eq("list_id", list.id);
    toast({ title: "הרשימה שוחזרה" });
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
    setBusy(null);
    onOpenList(list.id);
  };

  if (loading) {
    return (
      <div className="px-3 space-y-3 pt-3" dir="rtl">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-3 space-y-5" dir="rtl">
      <div className="pt-1">
        <h1 className="font-display text-xl font-bold text-right">היסטוריה</h1>
      </div>

      {lists.length > 0 && (
        <div className="surface-card p-4 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="text-[11px] text-muted-foreground">השבוע</div>
          <div className="font-display font-bold text-lg mt-0.5">
            {summary.items} פריטים · {summary.lists} רשימות
          </div>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="surface-card p-8 text-center space-y-3">
          <Package className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="font-display font-semibold">אין עדיין היסטוריה</div>
          <p className="text-sm text-muted-foreground">
            רשימות שתסיים יופיעו כאן עם אפשרות "קנה שוב"
          </p>
        </div>
      ) : (
        grouped.map(([label, gLists]) => (
          <section key={label} className="space-y-2.5">
            <h2 className="text-xs font-semibold text-muted-foreground text-right px-1">
              {label}
            </h2>
            {gLists.map((list) => {
              const preview = list.items.slice(0, 3).map((i) => i.name);
              return (
                <div key={list.id} className="surface-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[11px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(list.archived_at), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </div>
                    <div className="text-right flex-1 min-w-0">
                      <div className="font-display font-semibold truncate">{list.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {list.items.length} פריטים
                      </div>
                    </div>
                  </div>

                  {preview.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {preview.map((n, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-1 rounded-lg bg-muted text-muted-foreground"
                        >
                          {n}
                        </span>
                      ))}
                      {list.items.length > 3 && (
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                          +{list.items.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => buyAgain(list)}
                      disabled={busy === list.id || list.items.length === 0}
                      size="sm"
                      className="flex-1 rounded-xl"
                    >
                      <RotateCcw className="h-4 w-4" />
                      קנה שוב
                    </Button>
                    <Button
                      onClick={() => restoreList(list)}
                      disabled={busy === list.id}
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      שחזר
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
};
