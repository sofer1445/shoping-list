import { useState } from "react";
import { Plus, ListPlus, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLists, type ListSummary } from "@/hooks/useLists";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ListCard } from "./ListCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onOpenList: (id: string) => void;
}

export const ListsHome = ({ onOpenList }: Props) => {
  const { lists, isLoading, error, refetch } = useLists();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<ListSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const [deleting, setDeleting] = useState<ListSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const owned = lists.filter((l) => l.is_owner);
  const shared = lists.filter((l) => !l.is_owner);

  const fail = (e: any) =>
    toast({
      title: "שגיאה",
      description: e?.message || "הפעולה לא הושלמה. נסה שוב.",
      variant: "destructive",
    });

  const createList = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("shopping_lists")
        .insert({ name: name.trim(), created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      toast({ title: "רשימה נוצרה", description: name.trim() });
      setName("");
      setOpen(false);
      await refetch();
      if (data) onOpenList(data.id);
    } catch (e: any) {
      fail(e);
    } finally {
      setCreating(false);
    }
  };

  const openRename = (list: ListSummary) => {
    setRenaming(list);
    setRenameValue(list.name);
  };

  const saveRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    setSavingRename(true);
    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ name: renameValue.trim() })
        .eq("id", renaming.id);
      if (error) throw error;
      toast({ title: "השם עודכן", description: renameValue.trim() });
      setRenaming(null);
      await refetch();
    } catch (e: any) {
      fail(e);
    } finally {
      setSavingRename(false);
    }
  };

  const duplicateList = async (list: ListSummary) => {
    if (!user) return;
    setBusy(true);
    try {
      const { data: newList, error: createError } = await supabase
        .from("shopping_lists")
        .insert({ name: `${list.name} (עותק)`, created_by: user.id })
        .select()
        .single();
      if (createError) throw createError;

      const { data: items, error: itemsError } = await supabase
        .from("shopping_items")
        .select("name, quantity, category")
        .eq("list_id", list.id)
        .eq("archived", false);
      if (itemsError) throw itemsError;

      if (items?.length && newList) {
        const { error: insertError } = await supabase.from("shopping_items").insert(
          items.map((i) => ({
            list_id: newList.id,
            name: i.name,
            quantity: i.quantity,
            category: i.category,
            created_by: user.id,
          }))
        );
        if (insertError) throw insertError;
      }

      toast({ title: "הרשימה שוכפלה", description: `${list.name} (עותק)` });
      await refetch();
    } catch (e: any) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const archiveList = async (list: ListSummary) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ archived: true, archived_at: new Date().toISOString() })
        .eq("id", list.id);
      if (error) throw error;
      toast({ title: "הרשימה הועברה לארכיון", description: list.name });
      await refetch();
    } catch (e: any) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const { error: itemsError } = await supabase
        .from("shopping_items")
        .delete()
        .eq("list_id", deleting.id);
      if (itemsError) throw itemsError;

      const { error: sharesError } = await supabase
        .from("list_shares")
        .delete()
        .eq("list_id", deleting.id);
      if (sharesError) throw sharesError;

      const { error } = await supabase.from("shopping_lists").delete().eq("id", deleting.id);
      if (error) throw error;

      toast({ title: "הרשימה נמחקה", description: deleting.name });
      setDeleting(null);
      await refetch();
    } catch (e: any) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-3 space-y-5" dir="rtl">
      <div className="flex items-center justify-between pt-1">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5">
              <Plus className="h-4 w-4" />
              רשימה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">רשימה חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם הרשימה (למשל: סופר שישי)"
                className="text-right"
                onKeyDown={(e) => e.key === "Enter" && createList()}
              />
              <Button onClick={createList} disabled={!name.trim() || creating} className="w-full">
                צור רשימה
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <h1 className="font-display text-xl font-bold">הרשימות שלי</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="surface-card p-8 text-center space-y-3" role="alert">
          <WifiOff className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="font-display font-semibold">הרשימות לא נטענו</div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={refetch} variant="outline" className="rounded-xl">
            <RefreshCw className="h-4 w-4" />
            נסה שוב
          </Button>
        </div>
      ) : lists.length === 0 ? (
        <div className="surface-card p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <ListPlus className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="font-display font-semibold">בואו נתחיל</div>
            <p className="text-sm text-muted-foreground mt-1">
              צור את הרשימה הראשונה ותחסוך זמן בסופר הבא
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="rounded-xl">
            <Plus className="h-4 w-4" />
            צור רשימה ראשונה
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {owned.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground text-right px-1">
                הרשימות שלך
              </h2>
              <div className="space-y-2.5">
                {owned.map((l) => (
                  <ListCard
                    key={l.id}
                    list={l}
                    onOpen={onOpenList}
                    onRename={openRename}
                    onDuplicate={duplicateList}
                    onArchive={archiveList}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            </section>
          )}

          {shared.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground text-right px-1">
                משותפות איתך
              </h2>
              <div className="space-y-2.5">
                {shared.map((l) => (
                  <ListCard key={l.id} list={l} onOpen={onOpenList} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={!!renaming} onOpenChange={(v) => !v && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">שינוי שם הרשימה</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="text-right"
              onKeyDown={(e) => e.key === "Enter" && saveRename()}
            />
            <Button
              onClick={saveRename}
              disabled={!renameValue.trim() || savingRename}
              className="w-full"
            >
              שמור שם
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              למחוק את "{deleting?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              הרשימה וכל הפריטים שבה יימחקו לגמרי ולא יהיה אפשר לשחזר אותם. אם רק סיימת לקנות, אפשר
              במקום זה להעביר לארכיון.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "מוחק..." : "מחק רשימה"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
