import { FileOutput } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingItem } from "./types";
import { useActivityLog } from "@/hooks/useActivityLog";

interface ExportToNewListButtonProps {
  listId: string;
  items: ShoppingItem[];
  onExport: (newListId: string) => void;
}

export const ExportToNewListButton = ({ listId, items, onExport }: ExportToNewListButtonProps) => {
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  const handleExport = async () => {
    try {
      // Get active (not completed) items
      const activeItems = items.filter(item => !item.completed);

      if (activeItems.length === 0) {
        toast({
          title: "אין פריטים פעילים",
          description: "כל הפריטים ברשימה מסומנים כמושלמים",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create new list
      const { data: newList, error: createError } = await supabase
        .from("shopping_lists")
        .insert({
          name: "רשימת קניות",
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copy active items to new list
      const itemsToInsert = activeItems.map(item => ({
        list_id: newList.id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        completed: false,
        created_by: user.id,
      }));

      const { error: insertError } = await supabase
        .from("shopping_items")
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      // Archive the old list
      const { error: archiveError } = await supabase
        .from("shopping_lists")
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq("id", listId);

      if (archiveError) throw archiveError;

      await logActivity('list_created', { list_id: newList.id, exported_from: listId });

      toast({
        title: "רשימה חדשה נוצרה",
        description: `${activeItems.length} פריטים פעילים הועברו לרשימה חדשה`,
      });

      onExport(newList.id);
    } catch (error) {
      console.error("Error exporting to new list:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה ליצור רשימה חדשה",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-2"
    >
      <FileOutput size={16} />
      ייצא לרשימה חדשה
    </Button>
  );
};
