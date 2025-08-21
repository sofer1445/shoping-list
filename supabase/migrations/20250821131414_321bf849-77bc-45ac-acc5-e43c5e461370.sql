-- Fix the Security Definer View issue
-- Drop the current SECURITY DEFINER view and recreate as a regular view with RLS

-- Drop the existing user_daily_activity view if it exists
DROP VIEW IF EXISTS user_daily_activity;

-- Recreate as a regular view without SECURITY DEFINER
CREATE VIEW user_daily_activity AS
SELECT 
    user_id,
    date_trunc('day', timestamp) as day,
    activity_type,
    count(*) as activity_count
FROM user_activity_log
GROUP BY user_id, date_trunc('day', timestamp), activity_type;

-- Enable RLS on the view (this will inherit from the underlying table's RLS)
ALTER VIEW user_daily_activity SET (security_invoker = true);

-- Fix the function search path issue for the existing functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.log_user_activity(activity_type, jsonb) SET search_path = public;