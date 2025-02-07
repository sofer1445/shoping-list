
export type SharePermission = 'view' | 'edit';
export type ActivityType = 'login' | 'logout' | 'list_created' | 'list_archived' | 'item_added' | 'item_completed' | 'item_deleted' | 'list_shared';

export interface Profile {
  id: string;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
}

export interface ShoppingList {
  id: string;
  created_at: string;
  created_by: string;
  archived: boolean | null;
  archived_at: string | null;
  name: string;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  quantity: number;
  completed: boolean;
  created_at: string;
  created_by: string;
  completed_at: string | null;
  completed_by: string | null;
  archived: boolean | null;
  archived_at: string | null;
  name: string;
  category: string;
  isNew?: boolean;
  justCompleted?: boolean;
}

export interface ListShare {
  id: string;
  created_by: string;
  list_id: string | null;
  shared_with: string | null;
  permission: SharePermission;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  timestamp: string;
  details: Record<string, any> | null;
}

export interface UserDailyActivity {
  user_id: string | null;
  day: string | null;
  activity_type: ActivityType | null;
  activity_count: number | null;
}
