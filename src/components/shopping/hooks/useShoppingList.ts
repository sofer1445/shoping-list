import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";
import { useActivityLog } from "@/hooks/useActivityLog";

export const useShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();

  const fetchItems = useCallback(async () => {
    if (!currentListId) {
      console.log("No current list ID, skipping item fetch");
      return;
    }

    try {
      console.log("Fetching items for list:", currentListId);
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

      console.log("Fetched items:", data?.length || 0, "items");
      setItems(data || []);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לטעון את הפריטים",
        variant: "destructive",
      });
    }
  }, [currentListId, toast]);

  const createInitialList = useCallback(async () => {
    if (!user) {
      console.log("No user found, skipping list creation");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Checking for existing lists...");
      const { data: existingLists, error: fetchError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("created_by", user.id)
        .eq("archived", false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching lists:", fetchError);
        toast({
          title: "שגיאה",
          description: "לא ניתן היה לטעון את הרשימות",
          variant: "destructive",
        });
        return;
      }

      if (existingLists) {
        console.log("Found existing list:", existingLists.id);
        setCurrentListId(existingLists.id);
        return;
      }

      console.log("Creating new list...");
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

      if (newList) {
        console.log("Created new list:", newList.id);
        setCurrentListId(newList.id);
        await logActivity('list_created', { list_id: newList.id });
        toast({
          title: "רשימה חדשה נוצרה",
          description: "רשימת קניות חדשה נוצרה בהצלחה",
        });
      }
    } catch (error: any) {
      console.error("Error in createInitialList:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת הרשימה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, logActivity]);

  useEffect(() => {
    if (user && !currentListId && !isLoading) {
      createInitialList();
    }
  }, [user, currentListId, createInitialList, isLoading]);

  useEffect(() => {
    if (currentListId) {
      fetchItems();
    }
  }, [currentListId, fetchItems]);

  return {
    items,
    setItems,
    currentListId,
    setCurrentListId,
    createInitialList,
    fetchItems,
    isLoading,
  };
};