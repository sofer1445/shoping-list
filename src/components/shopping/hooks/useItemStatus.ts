import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingItem } from "../types";
import { useAuth } from "@/components/AuthProvider";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useToast } from "@/components/ui/use-toast";

export const useItemStatus = (items: ShoppingItem[], setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>) => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const pending = useRef(new Set<string>());

  const toggleItem = async (id: string) => {
    const item = items.find((value) => value.id === id);
    if (!item || !user || pending.current.has(id)) return false;
    pending.current.add(id);
    const fields = {
      completed: !item.completed,
      completed_at: !item.completed ? new Date().toISOString() : null,
      completed_by: !item.completed ? user.id : null,
    };
    try {
      const { error } = await supabase.from("shopping_items").update(fields)
        .eq("id", id).eq("completed", item.completed).select("id").single();
      if (error) throw error;
      setItems((previous) => previous.map((value) => value.id === id
        ? { ...value, ...fields, justCompleted: !item.completed } : value));
      if (!item.completed) void logActivity("item_completed", { item_id: id, item_name: item.name });
      window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      setTimeout(() => setItems((previous) => previous.map((value) => value.id === id
        ? { ...value, justCompleted: false } : value)), 3000);
      return true;
    } catch (error) {
      toast({ title: "העדכון לא נשמר", description: "ייתכן שהרשימה השתנתה במכשיר אחר. נסה שוב.", variant: "destructive" });
      return false;
    } finally { pending.current.delete(id); }
  };
  return { toggleItem };
};
