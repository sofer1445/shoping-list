
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingItem } from "../types";
import { useOfflineStorage } from "./useOfflineStorage";

export const useItemsFetching = () => {
  const { saveItemsToLocalStorage, handleOfflineMode } = useOfflineStorage();

  const fetchItems = useCallback(async (currentListId: string | null) => {
    if (!currentListId) {
      console.log("No current list ID, skipping item fetch");
      return { items: [], isOffline: false, hasError: false };
    }

    try {
      console.log("Fetching items for list:", currentListId);
      
      // Add Authorization header explicitly
      const { data: session } = await supabase.auth.getSession();
      console.log("Current session:", session ? "Valid" : "Invalid");

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
          listId: currentListId,
          hasSession: !!session
        });
        throw error;
      }

      console.log("Fetched items successfully:", data?.length || 0, "items");
      const items = data || [];
      saveItemsToLocalStorage(items);
      return { items, isOffline: false, hasError: false };
    } catch (error: any) {
      console.error("Detailed error in fetchItems:", {
        error,
        stack: error.stack,
        context: { 
          listId: currentListId,
          url: error.url,
          message: error.message,
          status: error.status
        }
      });
      const offlineItems = handleOfflineMode();
      return {
        items: offlineItems,
        isOffline: true,
        hasError: offlineItems.length === 0
      };
    }
  }, [saveItemsToLocalStorage, handleOfflineMode]);

  return { fetchItems };
};
