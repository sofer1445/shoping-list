import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";
import { useActivityLog } from "@/hooks/useActivityLog";

export const useShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();

  useEffect(() => {
    if (user && !currentListId) {
      createInitialList();
    }
  }, [user]);

  useEffect(() => {
    if (currentListId) {
      fetchItems();
    }
  }, [currentListId]);

  const createInitialList = async () => {
    if (!user) {
      console.log("No user found, skipping list creation");
      return;
    }

    try {
      const { data: existingLists, error: fetchError } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("created_by", user.id)
        .eq("archived", false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching lists:", fetchError);
        toast({
          title: "שגיאה",
          description: "לא ניתן היה לטעון את הרשימות",
          variant: "destructive",
        });
        return;
      }

      if (existingLists && existingLists.length > 0) {
        console.log("Found existing list:", existingLists[0].id);
        setCurrentListId(existingLists[0].id);
        return;
      }

      console.log("No existing lists found, creating new one");
      const { data: newList, error: createError } = await supabase
        .from("shopping_lists")
        .insert({
          name: "רשימת קניות",
          created_by: user.id,
          archived: false,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating list:", createError);
        toast({
          title: "שגיאה",
          description: "לא ניתן היה ליצור רשימה חדשה",
          variant: "destructive",
        });
        return;
      }
      
      if (!newList) {
        console.error("No list created");
        return;
      }

      console.log("Created new list:", newList.id);
      setCurrentListId(newList.id);
      await logActivity('list_created', { list_id: newList.id });
      
      toast({
        title: "רשימה חדשה נוצרה",
        description: "רשימת קניות חדשה נוצרה בהצלחה",
      });
    } catch (error: any) {
      console.error("Error creating/fetching list:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה ליצור רשימה חדשה",
        variant: "destructive",
      });
    }
  };

  const fetchItems = async () => {
    if (!currentListId) {
      console.log("No current list ID, skipping item fetch");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("list_id", currentListId)
        .eq("archived", false)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching items:", error);
        throw error;
      }

      console.log("Fetched items for list:", currentListId, data?.length || 0, "items");
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לטעון את הפריטים",
        variant: "destructive",
      });
    }
  };

  return {
    items,
    setItems,
    currentListId,
    setCurrentListId,
    createInitialList,
    fetchItems,
  };
};