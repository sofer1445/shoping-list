export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
  created_by?: string | null;
  completed_by?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  isNew?: boolean;
  justCompleted?: boolean;
}
