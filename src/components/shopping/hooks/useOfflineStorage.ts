import { useCallback } from "react";
import { ShoppingItem } from "../types";
import { saveToLocalStorage, getFromLocalStorage } from "@/utils/localStorageUtils";
import { useAuth } from "@/components/AuthProvider";

export const useOfflineStorage = () => {
  const { user } = useAuth();
  const saveItemsToLocalStorage = useCallback((items: ShoppingItem[], listId: string) => {
    if (user) saveToLocalStorage(items, user.id, listId);
  }, [user?.id]);
  const handleOfflineMode = useCallback((listId: string): ShoppingItem[] =>
    user ? getFromLocalStorage(user.id, listId) : [], [user?.id]);
  return { saveItemsToLocalStorage, handleOfflineMode };
};
