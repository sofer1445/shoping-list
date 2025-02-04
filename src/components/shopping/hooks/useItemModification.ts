import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";

export const useItemModification = (
  items: ShoppingItem[],
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>
) => {
  const { toast } = useToast();

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
      const { isNew, justCompleted, ...itemForDb } = updatedItem;
      
      const { error } = await supabase
        .from("shopping_items")
        .update(itemForDb)
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

  return { deleteItem, handleSaveEdit };
};