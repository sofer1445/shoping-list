import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";
import { useAuth } from "@/components/AuthProvider";

export const useShoppingItems = (
  items: ShoppingItem[],
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>,
  currentListId: string | null
) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const addItem = async (newItem: Omit<ShoppingItem, "id" | "completed" | "isNew">) => {
    if (!currentListId) return;
    
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          ...newItem,
          list_id: currentListId,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, { ...data, isNew: true }]);
      toast({
        title: "פריט נוסף",
        description: `${newItem.name} נוסף לרשימה`,
      });

      setTimeout(() => {
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === data.id ? { ...i, isNew: false } : i
          )
        );
      }, 3000);
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה להוסיף את הפריט",
        variant: "destructive",
      });
    }
  };

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

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const item = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (item) {
        toast({
          title: "פריט נמחק",
          description: `${item.name} הוסר מהרשימה`,
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה למחוק את הפריט",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async (updatedItem: ShoppingItem) => {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update(updatedItem)
        .eq("id", updatedItem.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );

      toast({
        title: "פריט עודכן",
        description: `${updatedItem.name} עודכן בהצלחה`,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לעדכן את הפריט",
        variant: "destructive",
      });
    }
  };

  return {
    addItem,
    toggleItem,
    deleteItem,
    handleSaveEdit,
  };
};