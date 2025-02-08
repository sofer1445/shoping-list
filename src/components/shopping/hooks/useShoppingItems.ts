import { ShoppingItem } from "../types";
import { useItemOperations } from "./useItemOperations";
import { useItemStatus } from "./useItemStatus";
import { useItemModification } from "./useItemModification";

export const useShoppingItems = (
  items: ShoppingItem[],
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>,
  currentListId: string | null
) => {
  const { addItem } = useItemOperations(setItems, currentListId);
  const { toggleItem } = useItemStatus(items, setItems);
  const { deleteItem, handleSaveEdit } = useItemModification(items, setItems);

  return {
    addItem,
    toggleItem,
    deleteItem,
    handleSaveEdit,
  };
};