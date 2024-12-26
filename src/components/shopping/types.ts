export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
  isNew?: boolean;
  justCompleted?: boolean;
}