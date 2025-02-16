
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingItem } from "../types";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useItemsFetching } from "./useItemsFetching";

export const useShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [hasAttemptedInitialFetch, setHasAttemptedInitialFetch] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { fetchItems: fetchItemsFromDB } = useItemsFetching();

  const fetchItems = useCallback(async () => {
    if (!currentListId) {
      console.log("No current list ID, skipping item fetch");
      return;
    }

    try {
      const { items: fetchedItems, isOffline, hasError: fetchError } = await fetchItemsFromDB(currentListId);
      setItems(fetchedItems);
      setIsOfflineMode(isOffline);
      setHasError(fetchError);
      
      if (fetchError) {
        toast({
          title: "שגיאה",
          description: "לא ניתן היה לטעון את הפריטים",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in fetchItems:", error);
    }
  }, [currentListId, toast, fetchItemsFromDB]);

  const createInitialList = useCallback(async () => {
    if (!user || hasAttemptedInitialFetch) {
      console.log("Skipping initial list creation:", { hasUser: !!user, hasAttemptedInitialFetch });
      return;
    }

    setIsLoading(true);
    setHasAttemptedInitialFetch(true);

    try {
      // בדוק אם יש רשימה קיימת
      const { data: existingLists, error: fetchError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("created_by", user.id)
        .eq("archived", false)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        setHasError(true);
        toast({
          title: "שגיאה",
          description: "לא ניתן היה לבדוק רשימות קיימות",
          variant: "destructive",
        });
        return;
      }

      // אם יש רשימה קיימת, השתמש בה
      if (existingLists) {
        console.log("Using existing list:", existingLists.id);
        setCurrentListId(existingLists.id);
        setHasError(false);
        return;
      }

      // אם אין רשימה קיימת, צור חדשה
      const { data: newList, error: createError } = await supabase
        .from("shopping_lists")
        .insert({
          name: "רשימת קניות",
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        setHasError(true);
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
        setHasError(false);
        await logActivity('list_created', { list_id: newList.id });
        toast({
          title: "רשימה חדשה נוצרה",
          description: "רשימת קניות חדשה נוצרה בהצלחה",
        });
      }
    } catch (error) {
      console.error("Error in createInitialList:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, logActivity, hasAttemptedInitialFetch]);

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
    hasError,
    isOfflineMode,
  };
};
