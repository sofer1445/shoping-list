
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ShoppingItem } from "../types";
import { useListInitialization } from "./useListInitialization";
import { useItemsFetching } from "./useItemsFetching";

export const useShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const { user } = useAuth();
  const { createInitialList } = useListInitialization();
  const { fetchItems } = useItemsFetching();

  useEffect(() => {
    if (user && !currentListId && !isLoading) {
      console.log("Triggering createInitialList due to:", {
        hasUser: !!user,
        currentListId,
        isLoading
      });
      setIsLoading(true);
      createInitialList()
        .then((listId) => {
          if (listId) {
            setCurrentListId(listId);
          }
        })
        .catch((error) => {
          console.error("Error in initial list creation:", error);
          setHasError(true);
          setIsOfflineMode(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, currentListId, createInitialList, isLoading]);

  useEffect(() => {
    if (currentListId) {
      console.log("Triggering fetchItems due to currentListId change:", currentListId);
      fetchItems(currentListId).then(({ items: newItems, isOffline, hasError: fetchError }) => {
        setItems(newItems);
        setIsOfflineMode(isOffline);
        setHasError(fetchError);
      });
    }
  }, [currentListId, fetchItems]);

  return {
    items,
    setItems,
    currentListId,
    setCurrentListId,
    createInitialList,
    fetchItems: () => fetchItems(currentListId),
    isLoading,
    hasError,
    isOfflineMode,
  };
};
