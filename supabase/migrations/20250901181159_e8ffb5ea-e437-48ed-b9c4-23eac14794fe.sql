-- Create tables for analytics and predictions

-- Table to store product analytics per user
CREATE TABLE public.user_product_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_name text NOT NULL,
  category text NOT NULL,
  total_purchases bigint NOT NULL DEFAULT 0,
  average_quantity numeric(10,2) NOT NULL DEFAULT 0,
  last_purchased_at timestamp with time zone,
  purchase_frequency_days numeric(10,2), -- average days between purchases
  seasonal_pattern jsonb, -- JSON object with seasonal data
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_name)
);

-- Table to store shopping predictions
CREATE TABLE public.shopping_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  predicted_items jsonb NOT NULL, -- array of predicted items with confidence scores
  prediction_date timestamp with time zone NOT NULL DEFAULT now(),
  prediction_period text NOT NULL, -- 'weekly', 'monthly', etc.
  confidence_score numeric(3,2) NOT NULL DEFAULT 0, -- 0-1 confidence score
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table to store user shopping patterns
CREATE TABLE public.user_shopping_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  pattern_type text NOT NULL, -- 'weekly', 'monthly', 'seasonal'
  pattern_data jsonb NOT NULL, -- detailed pattern information
  insights jsonb, -- human-readable insights
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, pattern_type)
);

-- Enable RLS on all analytics tables
ALTER TABLE public.user_product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shopping_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_product_analytics
CREATE POLICY "users_can_view_own_analytics" ON public.user_product_analytics
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_analytics" ON public.user_product_analytics
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_analytics" ON public.user_product_analytics
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for shopping_predictions
CREATE POLICY "users_can_view_own_predictions" ON public.shopping_predictions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_predictions" ON public.shopping_predictions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS policies for user_shopping_patterns
CREATE POLICY "users_can_view_own_patterns" ON public.user_shopping_patterns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_patterns" ON public.user_shopping_patterns
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_patterns" ON public.user_shopping_patterns
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Create function to trigger analytics processing
CREATE OR REPLACE FUNCTION public.trigger_analytics_processing(_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the analytics processing request
  INSERT INTO user_activity_log (user_id, activity_type, details)
  VALUES (
    COALESCE(_user_id, auth.uid()), 
    'analytics_processing'::activity_type, 
    jsonb_build_object('timestamp', now())
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.trigger_analytics_processing(uuid) TO authenticated;