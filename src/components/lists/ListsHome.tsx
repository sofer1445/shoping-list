import { useState } from "react";
import { Plus, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLists } from "@/hooks/useLists";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ListCard } from "./ListCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onOpenList: (id: string) => void;
}

export const ListsHome = ({ onOpenList }: Props) => {
  const { lists, isLoading, refetch } = useLists();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const owned = lists.filter((l) => l.is_owner);
  const shared = lists.filter((l) => !l.is_owner);

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
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
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
                  <ListCard key={l.id} list={l} onOpen={onOpenList} />
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
    </div>
  );
};
