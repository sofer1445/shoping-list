import { supabase } from "@/integrations/supabase/client";
import { ShoppingItem } from "../types";
import { useAuth } from "@/components/AuthProvider";

export const useItemStatus = (
  items: ShoppingItem[],
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>
) => {
  const { user } = useAuth();

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({
          completed: !item.completed,
          completed_at: !item.completed ? new Date().toISOString() : null,
          completed_by: !item.completed ? user?.id : null,
        })
        .eq("id", id);

      if (error) throw error;

      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === id
            ? { ...i, completed: !i.completed, justCompleted: !i.completed }
            : i
        )
      );

      setTimeout(() => {
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === id ? { ...i, justCompleted: false } : i
          )
        );
      }, 3000);
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  return { toggleItem };
};