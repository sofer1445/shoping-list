import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, Plus, ShoppingBag, CheckCircle2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShoppingList } from "./hooks/useShoppingList";
import { useShoppingItems } from "./hooks/useShoppingItems";
import { CategoryGroup } from "./CategoryGroup";
import { AddItemForm } from "./AddItemForm";
import { EditItemDialog } from "./EditItemDialog";
import { ShareListDialog } from "./ShareListDialog";
import { ShoppingItem } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useListPresence } from "@/hooks/useListPresence";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];

interface Props {
  listId: string | null;
  onSetListId: (id: string | null) => void;
  onBackToLists: () => void;
  onFinished: () => void;
}

export const ShoppingMode = ({ listId, onSetListId, onBackToLists, onFinished }: Props) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [listName, setListName] = useState("רשימת קניות");
  const { toast } = useToast();

  const shopping = useShoppingList();
  const {
    items,
    setItems,
    currentListId,
    setCurrentListId,
    fetchItems,
    isLoading,
  } = shopping;

  // Sync external listId prop into hook
  useEffect(() => {
    if (listId && listId !== currentListId) {
      setCurrentListId(listId);
    }
  }, [listId]);

  // Sync back to parent when hook decides on an initial list
  useEffect(() => {
    if (currentListId && currentListId !== listId) {
      onSetListId(currentListId);
    }
  }, [currentListId]);

  // Get list name
  useEffect(() => {
    if (!currentListId) return;
    supabase
      .from("shopping_lists")
      .select("name")
      .eq("id", currentListId)
      .maybeSingle()
      .then(({ data }) => data?.name && setListName(data.name));
  }, [currentListId]);

  // Realtime updates
  useEffect(() => {
    if (!currentListId) return;
    const ch = supabase
      .channel(`shopping-${currentListId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `list_id=eq.${currentListId}` },
        () => fetchItems()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [currentListId, fetchItems]);

  const { user } = useAuth();
  const { online, justUpdated, profiles } = useListPresence(currentListId);
  const otherOnline = online.filter((p) => p.user_id !== user?.id);

  const { addItem, toggleItem, handleSaveEdit } = useShoppingItems(items, setItems, currentListId);

  const visibleItems = useMemo(
    () => (showCompleted ? items : items.filter((i) => !i.completed)),
    [items, showCompleted]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>();
    for (const it of visibleItems) {
      const key = it.category || "אחר";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [visibleItems]);

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 20;

  const finishShopping = async () => {
    if (!currentListId) return;
    const { error } = await supabase
      .from("shopping_lists")
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq("id", currentListId);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "הקנייה הושלמה 🎉", description: "הרשימה עברה להיסטוריה" });
    onSetListId(null);
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
    onFinished();
  };

  if (isLoading || !currentListId) {
    return (
      <div className="px-3 space-y-3 pt-3" dir="rtl">
        <Skeleton className="h-16 rounded-2xl" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-32 bg-gradient-to-b from-primary/[0.04] via-background to-background min-h-[100dvh]" dir="rtl">
      {/* Header with progress ring */}
      <div className="sticky top-14 z-20 bg-background/85 backdrop-blur-xl px-3 py-3 border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBackToLists}
            className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
            aria-label="חזרה"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="flex-1 text-right min-w-0">
            <div className="flex items-center gap-2 justify-end">
              {justUpdated && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-top-1">
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  עודכן זה עתה
                </span>
              )}
              <h1 className="font-display font-bold text-[17px] truncate">{listName}</h1>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {total - done > 0
                ? `נותרו ${total - done} פריטים לקנייה`
                : total > 0
                ? "סיימת הכל 🎉"
                : "הרשימה ריקה"}
            </div>
          </div>
          <div className="relative h-11 w-11 shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="22"
                cy="22"
                r="20"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
              {pct}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCompleted((s) => !s)}
            className="rounded-full text-xs h-8"
          >
            {showCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showCompleted ? "הסתר שסומנו" : "הצג גם שסומנו"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAdd((s) => !s)}
            className="rounded-full text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            הוסף
          </Button>
          <div className="mr-auto flex items-center gap-1.5">
            {otherOnline.length > 0 && (
              <div className="flex items-center -space-x-1.5 space-x-reverse">
                {otherOnline.slice(0, 3).map((p) => (
                  <div
                    key={p.user_id}
                    title={`${p.username} · מחובר עכשיו`}
                    className="h-6 w-6 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary relative"
                  >
                    {p.username.slice(0, 1).toUpperCase()}
                    <span className="absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full bg-success border border-background" />
                  </div>
                ))}
              </div>
            )}
            <ShareListDialog listId={currentListId} />
          </div>
        </div>

        {showAdd && (
          <div className="mt-3">
            <AddItemForm onAdd={addItem} categories={categories} items={items} />
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-3 pt-4 space-y-5">
        {total === 0 ? (
          <div className="surface-card p-8 text-center space-y-3 mt-6">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground" />
            <div className="font-display font-semibold">הרשימה ריקה</div>
            <p className="text-sm text-muted-foreground">הוסף פריט כדי להתחיל</p>
            <Button onClick={() => setShowAdd(true)} className="rounded-xl">
              <Plus className="h-4 w-4" />
              הוסף פריט ראשון
            </Button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success animate-in zoom-in-50 duration-500" />
            <div className="font-display font-semibold">סיימת את כל הרשימה 🎉</div>
            <p className="text-sm text-muted-foreground">מוכן לסיים ולשמור בהיסטוריה</p>
          </div>
        ) : (
          grouped.map(([cat, catItems]) => (
            <CategoryGroup
              key={cat}
              category={cat}
              items={catItems}
              onToggle={toggleItem}
              onEdit={setEditing}
              profiles={profiles}
            />
          ))
        )}
      </div>

      {/* Sticky finish bar */}
      {total > 0 && (
        <div
          className="fixed bottom-[72px] inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 px-3 py-2.5"
          style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto max-w-md">
            <Button
              onClick={finishShopping}
              size="lg"
              className="w-full rounded-2xl h-12 font-semibold"
              variant={pct === 100 ? "default" : "secondary"}
            >
              <CheckCircle2 className="h-5 w-5" />
              {pct === 100 ? "סיים ושמור בהיסטוריה" : `סיים קנייה (${done}/${total})`}
            </Button>
          </div>
        </div>
      )}

      <EditItemDialog
        item={editing}
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
        categories={categories}
      />
    </div>
  );
};
