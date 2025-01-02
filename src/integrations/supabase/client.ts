import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lpyxnwcxfpqiinncqswe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxweXhud2N4ZnBxaWlubmNxc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NzEyMDQsImV4cCI6MjA1MTA0NzIwNH0.L15l4DTAUBM0PKf_WhQS6jalXF-54lDlH_VVRvTa9jo";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Add a new policy to handle the `shopping_lists` relation without causing infinite recursion
supabase.rpc('create_policy', {
  table_name: 'shopping_lists',
  policy_name: 'prevent_infinite_recursion',
  definition: 'WITH RECURSIVE policy_cte AS (SELECT 1) SELECT 1 FROM policy_cte LIMIT 1'
});
