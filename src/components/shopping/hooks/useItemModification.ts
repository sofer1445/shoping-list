
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";
import { useActivityLog } from "@/hooks/useActivityLog";

export const useItemModification = (
  items: ShoppingItem[],
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>
) => {
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

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
        await logActivity('item_deleted', { 
          item_id: id,
          item_name: item.name 
        });
        
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
    const normalizedName = updatedItem.name.trim().toLocaleLowerCase("he");
    if (!normalizedName || updatedItem.quantity < 1) {
      toast({
        title: "פרטים לא תקינים",
        description: "יש להזין שם פריט וכמות של 1 לפחות",
        variant: "destructive",
      });
      return false;
    }

    const duplicate = items.some(
      (item) =>
        item.id !== updatedItem.id &&
        !item.completed &&
        item.name.trim().toLocaleLowerCase("he") === normalizedName
    );
    if (duplicate) {
      toast({
        title: "פריט כבר קיים",
        description: `״${updatedItem.name.trim()}״ כבר נמצא ברשימה`,
        variant: "destructive",
      });
      return false;
    }

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
      return true;
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לעדכן את הפריט",
        variant: "destructive",
      });
      return false;
    }
  };

  return { deleteItem, handleSaveEdit };
};
