-- Fix user activity data exposure by converting view to function with proper security

-- Drop the existing view since we can't enable RLS on it
DROP VIEW IF EXISTS user_daily_activity;

-- Create a security definer function that returns only the current user's activity data
CREATE OR REPLACE FUNCTION get_user_daily_activity()
RETURNS TABLE (
  user_id uuid,
  day timestamp with time zone,
  activity_type activity_type,
  activity_count bigint
) 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ual.user_id,
    date_trunc('day', ual.timestamp) as day,
    ual.activity_type,
    count(*) as activity_count
  FROM user_activity_log ual
  WHERE ual.user_id = auth.uid()  -- Only return current user's data
  GROUP BY ual.user_id, date_trunc('day', ual.timestamp), ual.activity_type;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_daily_activity() TO authenticated;