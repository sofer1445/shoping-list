import { ShoppingItem } from "@/components/shopping/types";

const LOCAL_STORAGE_KEY = 'shopping_list_backup';

export const saveToLocalStorage = (items: ShoppingItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromLocalStorage = (): ShoppingItem[] => {
  try {
    const items = localStorage.getItem(LOCAL_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};