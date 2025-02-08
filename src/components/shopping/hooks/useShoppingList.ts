
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { ShoppingItem } from "../types";
import { useListOperations } from "./useListOperations";
import { useOfflineStorage } from "./useOfflineStorage";

export const useShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [hasAttemptedInitialFetch, setHasAttemptedInitialFetch] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { createNewList, fetchExistingList } = useListOperations(user);
  const { saveItemsToLocalStorage, handleOfflineMode } = useOfflineStorage();

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
        console.error("Error details from fetchItems:", {
          error,
          errorCode: error.code,
          errorMessage: error.message,
          details: error.details,
          hint: error.hint,
          listId: currentListId
        });
        throw error;
      }

      console.log("Fetched items:", data?.length || 0, "items");
      setItems(data || []);
      saveItemsToLocalStorage(data || []);
      setHasError(false);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.error("Detailed error in fetchItems:", {
        error,
        stack: error.stack,
        context: { listId: currentListId }
      });
      const offlineItems = handleOfflineMode();
      setItems(offlineItems);
      setIsOfflineMode(true);
      if (offlineItems.length === 0) {
        setHasError(true);
      }
    }
  }, [currentListId, toast]);

  const createInitialList = useCallback(async () => {
    if (!user || hasAttemptedInitialFetch) {
      console.log("Skipping initial list creation:", { 
        hasUser: !!user, 
        hasAttemptedInitialFetch 
      });
      return;
    }

    setIsLoading(true);
    setHasAttemptedInitialFetch(true);

    try {
      console.log("Attempting to fetch existing list");
      const existingListId = await fetchExistingList();
      
      if (existingListId) {
        console.log("Found existing list:", existingListId);
        setCurrentListId(existingListId);
        return;
      }

      console.log("No existing list found, creating new list");
      const newListId = await createNewList();
      if (newListId) {
        console.log("Created new list:", newListId);
        setCurrentListId(newListId);
      } else {
        console.error("Failed to create new list - no ID returned");
      }
    } catch (error) {
      console.error("Detailed error in createInitialList:", {
        error,
        stack: error.stack,
        context: { userId: user?.id }
      });
      setHasError(true);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  }, [user, hasAttemptedInitialFetch, createNewList, fetchExistingList]);

  useEffect(() => {
    if (user && !currentListId && !isLoading) {
      console.log("Triggering createInitialList due to:", {
        hasUser: !!user,
        currentListId,
        isLoading
      });
      createInitialList();
    }
  }, [user, currentListId, createInitialList, isLoading]);

  useEffect(() => {
    if (currentListId) {
      console.log("Triggering fetchItems due to currentListId change:", currentListId);
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
