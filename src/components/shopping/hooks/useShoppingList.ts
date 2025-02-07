import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { ShoppingItem } from "../types";
import { useActivityLog } from "@/hooks/useActivityLog";
import { saveToLocalStorage, getFromLocalStorage } from "@/utils/localStorageUtils";

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
        throw error;
      }

      console.log("Fetched items:", data?.length || 0, "items");
      setItems(data || []);
      saveToLocalStorage(data || []); // Backup to local storage
      setHasError(false);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      const localItems = getFromLocalStorage();
      if (localItems.length > 0) {
        setItems(localItems);
        setIsOfflineMode(true);
        toast({
          title: "מצב לא מקוון",
          description: "משתמש בנתונים מקומיים שנשמרו",
          variant: "warning",
        });
      } else {
        setHasError(true);
      }
    }
  }, [currentListId, toast]);

  const createInitialList = useCallback(async () => {
    if (!user || hasAttemptedInitialFetch) {
      return;
    }

    setIsLoading(true);
    setHasAttemptedInitialFetch(true);

    try {
      const { data: existingList, error: fetchError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("created_by", user.id)
        .eq("archived", false)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingList) {
        console.log("Found existing list:", existingList.id);
        setCurrentListId(existingList.id);
        return;
      }

      const { data: newList, error: createError } = await supabase
        .from("shopping_lists")
        .insert({
          name: "רשימת קניות",
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
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
      setHasError(true);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת הרשימה. משתמש במצב לא מקוון.",
        variant: "destructive",
      });
      setIsOfflineMode(true);
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