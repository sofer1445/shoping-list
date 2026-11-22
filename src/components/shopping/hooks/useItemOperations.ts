
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";
import { useAuth } from "@/components/AuthProvider";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useRef } from "react";
import { hasDuplicateItem, isValidQuantity, normalizeItemName } from "@/utils/shoppingValidation";

export const useItemOperations = (
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>,
  currentListId: string | null
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const pendingNames = useRef(new Set<string>());

  const addItem = async (newItem: Omit<ShoppingItem, "id" | "completed" | "isNew">, existingItems?: ShoppingItem[]) => {
    if (!currentListId || !user) return false;
    const normalizedName = normalizeItemName(newItem.name);
    if (!normalizedName || !isValidQuantity(newItem.quantity)) return false;
    if (pendingNames.current.has(normalizedName)) return false;

    // Check for duplicates
    if (existingItems) {
      const duplicate = hasDuplicateItem(existingItems, newItem.name);
      if (duplicate) {
        toast({
          title: "פריט כבר קיים",
          description: `"${newItem.name}" כבר נמצא ברשימה`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    pendingNames.current.add(normalizedName);
    try {
      const { data: currentItems, error: checkError } = await supabase
        .from("shopping_items").select("id, name").eq("list_id", currentListId).eq("archived", false);
      if (checkError) throw checkError;
      if (hasDuplicateItem(currentItems ?? [], newItem.name)) {
        toast({ title: "פריט כבר קיים", description: `״${newItem.name.trim()}״ כבר נמצא ברשימה`, variant: "destructive" });
        return false;
      }
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          ...newItem,
          name: newItem.name.trim().replace(/\s+/g, " "),
          list_id: currentListId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const itemWithNewFlag = { ...data, isNew: true };
      setItems((prev) => [...prev, itemWithNewFlag]);

      void logActivity('item_added', { 
        item_id: data.id,
        list_id: currentListId,
        item_name: newItem.name 
      });

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
      window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      return true;
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה להוסיף את הפריט",
        variant: "destructive",
      });
      return false;
    } finally {
      pendingNames.current.delete(normalizedName);
    }
  };

  return { addItem };
};
