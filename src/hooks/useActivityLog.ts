
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type ActivityType = 'login' | 'logout' | 'list_created' | 'list_archived' | 'item_added' | 'item_completed' | 'item_deleted' | 'list_shared';

export const useActivityLog = () => {
  const { toast } = useToast();

  const logActivity = useCallback(async (
    activityType: ActivityType,
    details: Record<string, any> = {}
  ) => {
    try {
      const { error } = await supabase.rpc(
        'log_user_activity',
        {
          _activity_type: activityType,
          _details: details
        }
      );

      if (error) throw error;

      console.log(`Activity logged: ${activityType}`, details);
    } catch (error) {
      console.error('Error logging activity:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לתעד את הפעילות",
        variant: "destructive",
      });
    }
  }, [toast]);

  return { logActivity };
};
