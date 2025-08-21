-- Fix RLS for user_daily_activity to prevent unauthorized access to user activity data

-- Enable RLS on the user_daily_activity view
ALTER VIEW user_daily_activity ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only see their own activity data
CREATE POLICY "users_can_view_own_activity_summary" ON user_daily_activity
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Grant SELECT permission to authenticated users (they'll still be restricted by RLS)
GRANT SELECT ON user_daily_activity TO authenticated;