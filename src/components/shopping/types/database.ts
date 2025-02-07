export interface ShoppingList {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  archived?: boolean;
  archived_at?: string;
}

export interface ListShare {
  id: string;
  list_id: string;
  shared_with: string;
  permission: 'view' | 'edit';
  created_at: string;
  created_by: string;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  timestamp: string;
  details: Record<string, any> | null;
}