-- Fix shopping list access control security issue
-- The current policies have incorrect JOIN conditions that could prevent proper access control

-- Drop the problematic policies
DROP POLICY IF EXISTS "Enable read for users with access" ON shopping_lists;
DROP POLICY IF EXISTS "Enable update for users with access" ON shopping_lists;

-- Recreate the policies with correct JOIN conditions
CREATE POLICY "Enable read for users with access" ON shopping_lists
FOR SELECT TO authenticated
USING (
  (auth.uid() = created_by) 
  OR 
  (auth.uid() IN (
    SELECT list_shares.shared_with
    FROM list_shares
    WHERE list_shares.list_id = shopping_lists.id
  ))
);

CREATE POLICY "Enable update for users with access" ON shopping_lists
FOR UPDATE TO authenticated
USING (
  (auth.uid() = created_by) 
  OR 
  (auth.uid() IN (
    SELECT list_shares.shared_with
    FROM list_shares
    WHERE list_shares.list_id = shopping_lists.id 
    AND list_shares.permission = 'edit'::share_permission
  ))
);