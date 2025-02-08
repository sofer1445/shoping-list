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
      const { error } = await supabase
        .from("shopping_lists")
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq("id", listId);

      if (error) throw error;

      toast({
        title: "רשימה הועברה לארכיון",
        description: "הרשימה נשמרה בהצלחה בארכיון",
      });

      onArchive();
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