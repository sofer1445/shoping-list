import { ShoppingItem } from "../types";
import { useItemOperations } from "./useItemOperations";
import { useItemStatus } from "./useItemStatus";
import { useItemModification } from "./useItemModification";
import { useCallback } from "react";

export const useShoppingItems = (
  items: ShoppingItem[],
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>,
  currentListId: string | null
) => {
  const { addItem: rawAddItem } = useItemOperations(setItems, currentListId);
  const { toggleItem } = useItemStatus(items, setItems);
  const { deleteItem, handleSaveEdit } = useItemModification(items, setItems);

  const addItem = useCallback(
    (newItem: Omit<ShoppingItem, "id" | "completed" | "isNew">) => {
      return rawAddItem(newItem, items);
    },
    [rawAddItem, items]
  );

  return {
    addItem,
    toggleItem,
    deleteItem,
    handleSaveEdit,
  };
};