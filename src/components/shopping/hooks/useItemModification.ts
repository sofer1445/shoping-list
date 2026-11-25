
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";
import { useActivityLog } from "@/hooks/useActivityLog";
import { hasDuplicateItem, isDuplicateItemError, isValidQuantity, normalizeItemName } from "@/utils/shoppingValidation";

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
    const normalizedName = normalizeItemName(updatedItem.name);
    if (!normalizedName || !isValidQuantity(updatedItem.quantity)) {
      toast({
        title: "פרטים לא תקינים",
        description: "יש להזין שם פריט וכמות של 1 לפחות",
        variant: "destructive",
      });
      return false;
    }

    const duplicate = hasDuplicateItem(items, updatedItem.name, updatedItem.id);
    if (duplicate) {
      toast({
        title: "פריט כבר קיים",
        description: `״${updatedItem.name.trim()}״ כבר נמצא ברשימה`,
        variant: "destructive",
      });
      return false;
    }

    try {
      // Persist editable fields only; an edit must not undo another shopper's completion.
      const itemForDb = { name: updatedItem.name.trim(), quantity: updatedItem.quantity, category: updatedItem.category };
      const { error } = await supabase
        .from("shopping_items")
        .update(itemForDb)
        .eq("id", updatedItem.id)
        .select("id").single();

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedItem.id ? { ...item, ...itemForDb } : item
        )
      );

      toast({
        title: "פריט עודכן",
        description: `${updatedItem.name} עודכן בהצלחה`,
      });
      window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      return true;
    } catch (error) {
      if (isDuplicateItemError(error)) {
        toast({ title: "פריט כבר קיים", description: `״${updatedItem.name.trim()}״ כבר נמצא ברשימה`, variant: "destructive" });
        return false;
      }
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
