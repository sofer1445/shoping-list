import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const loadHistory = async (userId: string): Promise<ArchivedList[]> => {
  const { data: ls, error } = await supabase
    .from("shopping_lists")
    .select("id, name, archived_at")
    .eq("archived", true)
    .eq("created_by", userId)
    .order("archived_at", { ascending: false })
    .limit(60);
  if (error) throw error;

  const ids = (ls || []).map((l) => l.id);
  if (ids.length === 0) return [];

  // single batched query instead of one request per list
  const { data: items, error: itemsError } = await supabase
    .from("shopping_items")
    .select("*")
    .in("list_id", ids);
  if (itemsError) throw itemsError;

  const byList = new Map<string, ShoppingItem[]>();
  ((items || []) as ShoppingItem[]).forEach((it) => {
    const arr = byList.get(it.list_id) || [];
    arr.push(it);
    byList.set(it.list_id, arr);
  });

  return (ls || []).map((l) => ({ ...l, items: byList.get(l.id) || [] }));
};

export const HistoryTimeline = ({ onOpenList }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["history", user?.id],
    queryFn: () => loadHistory(user!.id),
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

  const lists = query.data ?? [];
  const loading = query.isPending;
  const loadError = query.isError;

  const load = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["history", user?.id] });
  }, [queryClient, user?.id]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener("shopping-list-updated", h);
    return () => window.removeEventListener("shopping-list-updated", h);
  }, [load]);



  const grouped = useMemo(() => {
    const map = new Map<string, ArchivedList[]>();
    lists.forEach((l) => {
      const label = format(new Date(l.archived_at), "MMMM yyyy", { locale: he });
      map.set(label, [...(map.get(label) || []), l]);
    });
    return Array.from(map.entries());
  }, [lists]);

  const summary = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const recentLists = lists.filter((l) => new Date(l.archived_at) >= weekAgo);
    const monthLists = lists.filter((l) => new Date(l.archived_at) >= monthAgo);
    const items = recentLists.reduce((s, l) => s + l.items.length, 0);
    const avgPerWeek = monthLists.length > 0 ? (monthLists.length / 4).toFixed(1) : "0";
    return { lists: recentLists.length, items, avgPerWeek };
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
        const { error: itemsError } = await supabase.from("shopping_items").insert(
          list.items.map((it) => ({
            list_id: newList.id,
            name: it.name,
            quantity: it.quantity,
            category: it.category,
            completed: false,
            created_by: user.id,
          }))
        );
        if (itemsError) {
          await supabase.from("shopping_lists").delete().eq("id", newList.id);
          throw itemsError;
        }
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
    try {
      const { error: listError } = await supabase
        .from("shopping_lists")
        .update({ archived: false, archived_at: null })
        .eq("id", list.id);
      if (listError) throw listError;
      const { error: itemsError } = await supabase
        .from("shopping_items")
        .update({ archived: false, archived_at: null })
        .eq("list_id", list.id);
      if (itemsError) throw itemsError;
      toast({ title: "הרשימה שוחזרה" });
      window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      onOpenList(list.id);
    } catch (error) {
      console.error("Error restoring list:", error);
      toast({ title: "השחזור לא הושלם", description: "נסה שוב בעוד רגע", variant: "destructive" });
    } finally {
      setBusy(null);
    }
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

      {loadError ? (
        <div className="surface-card p-8 text-center space-y-3" role="alert">
          <Package className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="font-display font-semibold">ההיסטוריה לא נטענה</div>
          <p className="text-sm text-muted-foreground">בדוק את החיבור ונסה שוב</p>
          <Button onClick={load} variant="outline" className="rounded-xl">
            <RotateCcw className="h-4 w-4" />
            נסה שוב
          </Button>
        </div>
      ) : lists.length > 0 && (
        <div className="surface-card p-4 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground">השבוע</div>
              <div className="font-display font-bold text-lg mt-0.5">
                {summary.items} פריטים · {summary.lists} רשימות
              </div>
            </div>
            <div className="text-left">
              <div className="text-[11px] text-muted-foreground">קצב ממוצע</div>
              <div className="font-display font-bold text-lg mt-0.5 text-primary">
                {summary.avgPerWeek}<span className="text-[11px] text-muted-foreground font-normal">/שבוע</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loadError && lists.length === 0 ? (
        <div className="surface-card p-8 text-center space-y-3">
          <Package className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="font-display font-semibold">אין עדיין היסטוריה</div>
          <p className="text-sm text-muted-foreground">
            רשימות שתסיים יופיעו כאן עם אפשרות "קנה שוב"
          </p>
        </div>
      ) : !loadError ? (
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
      ) : null}
    </div>
  );
};
