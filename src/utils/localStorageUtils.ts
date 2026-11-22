import { ShoppingItem } from "@/components/shopping/types";

const storageKey = (userId: string, listId: string) => `shopping_list_backup:${userId}:${listId}`;

export const saveToLocalStorage = (items: ShoppingItem[], userId: string, listId: string) => {
  try {
    localStorage.setItem(storageKey(userId, listId), JSON.stringify(items));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromLocalStorage = (userId: string, listId: string): ShoppingItem[] => {
  try {
    const stored = localStorage.getItem(storageKey(userId, listId));
    const items: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(items) && items.every((item) =>
      item && typeof item.id === "string" && typeof item.name === "string" &&
      typeof item.completed === "boolean" && Number.isSafeInteger(item.quantity) && item.quantity >= 1
    ) ? items : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};