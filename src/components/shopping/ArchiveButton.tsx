import { Archive } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ArchiveButtonProps {
  listId: string;
  onArchive: () => void;
}

export const ArchiveButton = ({ listId, onArchive }: ArchiveButtonProps) => {
  const { toast } = useToast();

  const handleArchive = async () => {
    try {
      const { error, status } = await supabase
        .from("shopping_lists")
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq("id", listId);

      if (error) {
        if (status === 406) {
          const { data: listsArray } = await supabase
            .from("shopping_lists")
            .select("id, name, archived_at")
            .eq("archived", true)
            .eq("created_by", user.id)
            .order("archived_at", { ascending: false })
            .limit(100); // Adjust the limit as needed

          setArchivedLists(listsArray);
        } else {
          throw error;
        }
      } else {
        toast({
          title: "רשימה הועברה לארכיון",
          description: "הרשימה נשמרה בהצלחה בארכיון",
        });

        onArchive();
      }
    } catch (error) {
      console.error("Error archiving list:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה להעביר את הרשימה לארכיון",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleArchive}
      className="gap-2"
    >
      <Archive size={16} />
      העבר לארכיון
    </Button>
  );
};
