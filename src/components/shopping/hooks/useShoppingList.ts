import { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingItem } from "../types";
import { useItemsFetching } from "./useItemsFetching";

export const useShoppingList = (listId?: string | null) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(!!listId);
  const [hasError, setHasError] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { fetchItems: fetchItemsFromDB } = useItemsFetching();
  const request = useRef(0);
  const selection = useRef(listId);
  selection.current = listId;

  const fetchItems = useCallback(async () => {
    if (!listId) return;
    const version = ++request.current;
    const result = await fetchItemsFromDB(listId);
    if (version !== request.current || selection.current !== listId) return;
    setItems(result.items);
    setIsOfflineMode(result.isOffline);
    setHasError(result.hasError);
    setIsLoading(false);
  }, [listId, fetchItemsFromDB]);

  useEffect(() => {
    setItems([]);
    setHasError(false);
    setIsOfflineMode(false);
    setIsLoading(!!listId);
    void fetchItems();
    return () => { request.current++; };
  }, [listId, fetchItems]);

  return { items, setItems, currentListId: listId ?? null, fetchItems, isLoading, hasError, isOfflineMode };
};
