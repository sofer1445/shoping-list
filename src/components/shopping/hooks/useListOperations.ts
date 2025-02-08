
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
      console.log("Creating new list for user:", user?.id);
      const { data: newList, error: createError } = await supabase
        .from("shopping_lists")
        .insert({
          name: "רשימת קניות",
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error details from createNewList:", {
          error: createError,
          errorCode: createError.code,
          errorMessage: createError.message,
          details: createError.details,
          hint: createError.hint
        });
        throw createError;
      }

      console.log("Successfully created new list:", newList);

      if (newList) {
        await logActivity('list_created', { list_id: newList.id });
        toast({
          title: "רשימה חדשה נוצרה",
          description: "רשימת קניות חדשה נוצרה בהצלחה",
        });
        return newList.id;
      }
    } catch (error: any) {
      console.error("Detailed error in createNewList:", {
        error,
        stack: error.stack,
        context: { userId: user?.id }
      });
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
      console.log("Fetching existing list for user:", user?.id);
      const { data: existingList, error: fetchError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("created_by", user?.id)
        .eq("archived", false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error details from fetchExistingList:", {
          error: fetchError,
          errorCode: fetchError.code,
          errorMessage: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          query: {
            userId: user?.id,
            archived: false
          }
        });
        throw fetchError;
      }

      console.log("Fetch existing list result:", existingList);
      return existingList?.id || null;
    } catch (error: any) {
      console.error("Detailed error in fetchExistingList:", {
        error,
        stack: error.stack,
        context: { userId: user?.id }
      });
      return null;
    }
  };

  return {
    createNewList,
    fetchExistingList,
    isLoading,
  };
};
