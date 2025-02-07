import { ShoppingItem } from "../types";
import { saveToLocalStorage, getFromLocalStorage } from "@/utils/localStorageUtils";
import { useToast } from "@/hooks/use-toast";

export const useOfflineStorage = () => {
  const { toast } = useToast();

  const saveItemsToLocalStorage = (items: ShoppingItem[]) => {
    try {
      saveToLocalStorage(items);
      return true;
    } catch (error) {
      console.error("Error saving to local storage:", error);
      return false;
    }
  };

  const getItemsFromLocalStorage = (): ShoppingItem[] => {
    try {
      return getFromLocalStorage();
    } catch (error) {
      console.error("Error reading from local storage:", error);
      return [];
    }
  };

  const handleOfflineMode = () => {
    const localItems = getItemsFromLocalStorage();
    if (localItems.length > 0) {
      toast({
        title: "מצב לא מקוון",
        description: "משתמש בנתונים מקומיים שנשמרו",
        variant: "default",
      });
      return localItems;
    }
    return [];
  };

  return {
    saveItemsToLocalStorage,
    getItemsFromLocalStorage,
    handleOfflineMode,
  };
};