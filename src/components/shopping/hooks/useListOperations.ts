import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";

export const useListOperations = (user: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  const createNewList = async () => {
    try {
      const { data: newList, error: createError } = await supabase
        .from("shopping_lists")
        .insert({
          name: "רשימת קניות",
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      if (newList) {
        await logActivity('list_created', { list_id: newList.id });
        toast({
          title: "רשימה חדשה נוצרה",
          description: "רשימת קניות חדשה נוצרה בהצלחה",
        });
        return newList.id;
      }
    } catch (error: any) {
      console.error("Error in createNewList:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת הרשימה",
        variant: "destructive",
      });
      return null;
    }
  };

  const fetchExistingList = async () => {
    try {
      const { data: existingList, error: fetchError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("created_by", user?.id)
        .eq("archived", false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return existingList?.id || null;
    } catch (error) {
      console.error("Error in fetchExistingList:", error);
      return null;
    }
  };

  return {
    createNewList,
    fetchExistingList,
    isLoading,
  };
};