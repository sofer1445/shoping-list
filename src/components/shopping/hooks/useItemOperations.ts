import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";

export const useItemOperations = (
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>,
  currentListId: string | null
) => {
  const { toast } = useToast();

  const addItem = async (newItem: Omit<ShoppingItem, "id" | "completed" | "isNew">) => {
    if (!currentListId) return;
    
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          ...newItem,
          list_id: currentListId,
        })
        .select()
        .single();

      if (error) throw error;

      const itemWithNewFlag = { ...data, isNew: true };
      setItems((prev) => [...prev, itemWithNewFlag]);

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

  return { addItem };
};