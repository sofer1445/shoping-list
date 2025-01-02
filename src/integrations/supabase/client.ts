import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lpyxnwcxfpqiinncqswe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxweXhud2N4ZnBxaWlubmNxc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NzEyMDQsImV4cCI6MjA1MTA0NzIwNH0.L15l4DTAUBM0PKf_WhQS6jalXF-54lDlH_VVRvTa9jo";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Drop existing policies
await supabase.rpc('drop_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_select_for_users'
});
await supabase.rpc('drop_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_insert_for_users'
});
await supabase.rpc('drop_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_update_for_owners'
});
await supabase.rpc('drop_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_delete_for_owners'
});

// Enable RLS on the table
await supabase.rpc('enable_rls', {
  table_name: 'shopping_lists'
});

// Create simplified policies
await supabase.rpc('create_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_select_for_users',
  definition: 'USING (created_by = auth.uid())',
  action: 'SELECT',
  role: 'authenticated'
});
await supabase.rpc('create_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_insert_for_users',
  definition: 'WITH CHECK (created_by = auth.uid())',
  action: 'INSERT',
  role: 'authenticated'
});
await supabase.rpc('create_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_update_for_owners',
  definition: 'USING (created_by = auth.uid())',
  action: 'UPDATE',
  role: 'authenticated'
});
await supabase.rpc('create_policy', {
  table_name: 'shopping_lists',
  policy_name: 'enable_delete_for_owners',
  definition: 'USING (created_by = auth.uid())',
  action: 'DELETE',
  role: 'authenticated'
});
