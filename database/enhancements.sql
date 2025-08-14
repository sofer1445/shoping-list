-- Database Performance and Security Enhancements

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_created_by ON shopping_items(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON shopping_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_items_completed ON shopping_items(completed);
CREATE INDEX IF NOT EXISTS idx_shopping_items_created_at ON shopping_items(created_at);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_by ON shopping_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_archived ON shopping_lists(archived);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists(created_at);

CREATE INDEX IF NOT EXISTS idx_list_shares_list_id ON list_shares(list_id);
CREATE INDEX IF NOT EXISTS idx_list_shares_shared_with ON list_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_list_shares_created_by ON list_shares(created_by);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_timestamp ON user_activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shopping_items_user_list ON shopping_items(created_by, list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_completed ON shopping_items(list_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type ON user_activity_log(user_id, activity_type);

-- Create a view for user shopping patterns
CREATE OR REPLACE VIEW user_shopping_patterns AS
SELECT 
    si.created_by as user_id,
    si.category,
    si.name as item_name,
    COUNT(*) as frequency,
    MAX(si.created_at) as last_purchased,
    AVG(CASE WHEN si.completed THEN 1 ELSE 0 END) as completion_rate
FROM shopping_items si
WHERE si.created_at >= NOW() - INTERVAL '6 months'
GROUP BY si.created_by, si.category, si.name
HAVING COUNT(*) >= 2;

-- Create a view for popular items by category
CREATE OR REPLACE VIEW popular_items_by_category AS
SELECT 
    category,
    name as item_name,
    COUNT(DISTINCT created_by) as user_count,
    COUNT(*) as total_purchases,
    AVG(quantity) as avg_quantity
FROM shopping_items
WHERE created_at >= NOW() - INTERVAL '3 months'
GROUP BY category, name
HAVING COUNT(DISTINCT created_by) >= 3
ORDER BY category, user_count DESC;

-- Create a function for intelligent item recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(target_user_id UUID, current_list_items TEXT[])
RETURNS TABLE(
    item_name TEXT,
    category TEXT,
    confidence FLOAT,
    reason TEXT
) AS $$
BEGIN
    -- Frequent items not in current list
    RETURN QUERY
    SELECT 
        usp.item_name,
        usp.category,
        LEAST(usp.frequency::FLOAT / 10, 1.0) as confidence,
        'frequent_item' as reason
    FROM user_shopping_patterns usp
    WHERE usp.user_id = target_user_id
    AND usp.item_name != ALL(current_list_items)
    AND usp.last_purchased >= NOW() - INTERVAL '2 weeks'
    ORDER BY usp.frequency DESC
    LIMIT 5;
    
    -- Popular items in similar categories
    RETURN QUERY
    SELECT 
        pbc.item_name,
        pbc.category,
        LEAST(pbc.user_count::FLOAT / 10, 0.8) as confidence,
        'popular_item' as reason
    FROM popular_items_by_category pbc
    WHERE pbc.category IN (
        SELECT DISTINCT category 
        FROM shopping_items 
        WHERE name = ANY(current_list_items)
    )
    AND pbc.item_name != ALL(current_list_items)
    ORDER BY pbc.user_count DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- Add Row Level Security policies for better security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_lists
CREATE POLICY shopping_lists_owner_policy ON shopping_lists
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY shopping_lists_shared_policy ON shopping_lists
    FOR SELECT USING (
        id IN (
            SELECT list_id FROM list_shares 
            WHERE shared_with = auth.uid()
        )
    );

-- Policies for shopping_items
CREATE POLICY shopping_items_owner_policy ON shopping_items
    FOR ALL USING (
        list_id IN (
            SELECT id FROM shopping_lists 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY shopping_items_shared_policy ON shopping_items
    FOR ALL USING (
        list_id IN (
            SELECT list_id FROM list_shares 
            WHERE shared_with = auth.uid()
        )
    );

-- Policies for list_shares
CREATE POLICY list_shares_owner_policy ON list_shares
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY list_shares_recipient_policy ON list_shares
    FOR SELECT USING (shared_with = auth.uid());

-- Policies for user_activity_log
CREATE POLICY user_activity_log_policy ON user_activity_log
    FOR ALL USING (user_id = auth.uid());

-- Add triggers for automatic activity logging
CREATE OR REPLACE FUNCTION log_shopping_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_activity_log (user_id, activity_type, details)
        VALUES (NEW.created_by, 'item_added', 
                json_build_object('item_name', NEW.name, 'category', NEW.category, 'list_id', NEW.list_id));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.completed = false AND NEW.completed = true THEN
        INSERT INTO user_activity_log (user_id, activity_type, details)
        VALUES (NEW.completed_by, 'item_completed', 
                json_build_object('item_name', NEW.name, 'category', NEW.category, 'list_id', NEW.list_id));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO user_activity_log (user_id, activity_type, details)
        VALUES (OLD.created_by, 'item_deleted', 
                json_build_object('item_name', OLD.name, 'category', OLD.category, 'list_id', OLD.list_id));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS shopping_activity_trigger ON shopping_items;
CREATE TRIGGER shopping_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shopping_items
    FOR EACH ROW EXECUTE FUNCTION log_shopping_activity();

-- Create a function for data cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old activity logs (older than 1 year)
    DELETE FROM user_activity_log 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    -- Archive old completed shopping lists
    UPDATE shopping_lists 
    SET archived = true, archived_at = NOW()
    WHERE archived = false 
    AND created_at < NOW() - INTERVAL '6 months'
    AND id NOT IN (
        SELECT DISTINCT list_id 
        FROM shopping_items 
        WHERE completed = false
    );
    
    -- Delete old archived items
    DELETE FROM shopping_items 
    WHERE archived = true 
    AND archived_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Set up automatic cleanup (run daily)
-- Note: This would typically be set up as a cron job or scheduled function
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');