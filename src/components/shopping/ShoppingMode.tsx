import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, Plus, ShoppingBag, CheckCircle2, Radio, RefreshCw, WifiOff, Rows3, LayoutPanelTop, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShoppingList } from "./hooks/useShoppingList";
import { useShoppingItems } from "./hooks/useShoppingItems";
import { CategoryGroup } from "./CategoryGroup";
import { AddItemForm } from "./AddItemForm";
import { EditItemDialog } from "./EditItemDialog";
import { ShareListDialog } from "./ShareListDialog";
import { FocusMode } from "./FocusMode";
import { ExportToNewListButton } from "./ExportToNewListButton";
import { ShoppingItem } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useListPresence } from "@/hooks/useListPresence";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];
const VIEW_KEY = "shopping-view-mode";
type ViewMode = "list" | "focus";

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
  const [finishing, setFinishing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === "focus" ? "focus" : "list";
    } catch {
      return "list";
    }
  });
  const { toast } = useToast();

  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* storage unavailable (private mode / quota) — preference simply won't persist */
    }
  };


  const shopping = useShoppingList(listId);
  const {
    items,
    setItems,
    currentListId,
    setCurrentListId,
    fetchItems,
    isLoading,
    hasError,
    isOfflineMode,
  } = shopping;

  // Sync external listId prop into hook
  useEffect(() => {
    if (listId && listId !== currentListId) {
      setCurrentListId(listId);
      setItems([]);
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
      map.set(key, [...(map.get(key) || []), it]);
    }
    return Array.from(map.entries());
  }, [visibleItems]);

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 20;

  const finishShopping = async () => {
    if (!currentListId || finishing || isOfflineMode) return;
    setFinishing(true);
    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ archived: true, archived_at: new Date().toISOString() })
        .eq("id", currentListId);
      if (error) throw error;
      toast({ title: "הקנייה הושלמה 🎉", description: "הרשימה עברה להיסטוריה" });
      onSetListId(null);
      window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      onFinished();
    } catch (error) {
      console.error("Error finishing shopping:", error);
      toast({ title: "לא הצלחנו לסיים את הקנייה", description: "בדוק את החיבור ונסה שוב", variant: "destructive" });
    } finally {
      setFinishing(false);
    }
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

  // ===== Immersive focus mode: full-screen, minimal chrome =====
  if (viewMode === "focus") {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col bg-background"
        dir="rtl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Minimal top strip: exit + progress only */}
        <div className="shrink-0 px-3 pt-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => changeView("list")}
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full shrink-0"
              aria-label="יציאה ממצב קנייה"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary/70 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {done}/{total}
            </span>
          </div>
          {isOfflineMode && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" />
              מצב לא מקוון
            </div>
          )}
        </div>

        <FocusMode
          items={items}
          total={total}
          done={done}
          onToggle={toggleItem}
          onEdit={setEditing}
          profiles={profiles}
          onFinish={finishShopping}
          finishDisabled={finishing || isOfflineMode}
        />

        <EditItemDialog
          item={editing}
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
          categories={categories}
        />
      </div>
    );
  }

  return (
    <div className="pb-40 bg-gradient-to-b from-primary/[0.04] via-background to-background min-h-[100dvh]" dir="rtl">
      {/* Compact header */}
      <div className="sticky top-14 z-20 bg-background/85 backdrop-blur-xl px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button
            onClick={onBackToLists}
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full shrink-0"
            aria-label="חזרה"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-right min-w-0">
            <h1 className="font-display font-semibold text-[15px] truncate leading-tight">{listName}</h1>
            <div className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1.5 justify-start">
              <span className="truncate">
                {total - done > 0
                  ? `נותרו ${total - done} פריטים`
                  : total > 0
                  ? "סיימת הכל 🎉"
                  : "הרשימה ריקה"}
              </span>
              {justUpdated && (
                <span className="flex items-center gap-1 text-success/90 shrink-0 animate-in fade-in">
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  עודכן
                </span>
              )}
            </div>
          </div>
          <div className="relative h-8 w-8 shrink-0" aria-label={`הושלמו ${pct} אחוז`}>
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r="20"
                fill="none"
                stroke="hsl(var(--primary) / 0.75)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tabular-nums text-muted-foreground">
              {pct}
            </div>
          </div>
        </div>

        {/* Slim view switch + secondary actions in one row */}
        <div className="mt-2 flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-full bg-muted/70" role="tablist">
            {(
              [
                { key: "list" as ViewMode, label: "רשימה", Icon: Rows3 },
                { key: "focus" as ViewMode, label: "קנייה", Icon: LayoutPanelTop },
              ]
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                role="tab"
                aria-label={key === "list" ? "תצוגת רשימה" : "מצב קנייה"}
                aria-selected={viewMode === key}
                onClick={() => changeView(key)}
                className={cn(
                  "flex items-center justify-center gap-1 h-7 px-3 rounded-full text-[12px] font-medium transition-all",
                  viewMode === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowAdd((s) => !s)}
            className="h-8 w-8 rounded-full shrink-0"
            aria-label="הוסף פריט"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {viewMode === "list" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCompleted((s) => !s)}
              className="h-8 w-8 rounded-full shrink-0"
              aria-label={showCompleted ? "הסתר פריטים שסומנו" : "הצג גם פריטים שסומנו"}
            >
              {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}

          {viewMode === "list" && items.some((i) => !i.completed) && (
            <ExportToNewListButton
              compact
              listId={currentListId}
              items={items}
              onExport={(newListId) => {
                onSetListId(newListId);
                setItems([]);
                window.dispatchEvent(new CustomEvent("shopping-list-updated"));
              }}
            />
          )}



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
          <div className="mt-2">
            <AddItemForm onAdd={addItem} categories={categories} items={items} />
          </div>
        )}
      </div>


      {/* Content */}
      <div className="px-3 space-y-5 pt-4">

        {(isOfflineMode || hasError) && (
          <div className="surface-card p-3 flex items-center justify-between gap-3" role="status">
            <Button onClick={fetchItems} size="sm" variant="outline" className="rounded-xl shrink-0">
              <RefreshCw className="h-4 w-4" />
              נסה שוב
            </Button>
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-sm font-semibold">מצב לא מקוון</div>
                <div className="text-[11px] text-muted-foreground">מוצגים הפריטים האחרונים שנשמרו במכשיר</div>
              </div>
              <WifiOff className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </div>
        )}
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

      {/* Floating finish bar */}
      {total > 0 && (
        <div
          className="fixed bottom-[76px] inset-x-0 z-40 px-4 pointer-events-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-md pointer-events-auto rounded-2xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg p-1.5">

            <Button
              onClick={finishShopping}
              disabled={finishing || isOfflineMode}
              size="lg"
              className="w-full rounded-2xl h-12 font-semibold"
              variant={pct === 100 ? "default" : "secondary"}
            >
              <CheckCircle2 className="h-5 w-5" />
              {finishing
                ? "שומר..."
                : isOfflineMode
                ? "יש להתחבר כדי לסיים"
                : pct === 100
                ? "סיים ושמור בהיסטוריה"
                : `סיים קנייה (${done}/${total})`}
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
