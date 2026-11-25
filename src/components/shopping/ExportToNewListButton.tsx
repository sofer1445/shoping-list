import { useRef, useState } from "react";
import { FileOutput } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingItem } from "./types";
import { createListCopy } from "./copyList";
import { useActivityLog } from "@/hooks/useActivityLog";

interface ExportToNewListButtonProps {
  listId: string;
  items: ShoppingItem[];
  onExport: (newListId: string) => void;
  compact?: boolean;
}

export const ExportToNewListButton = ({ listId, items, onExport, compact }: ExportToNewListButtonProps) => {

  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const [exporting, setExporting] = useState(false);
  const pending = useRef(false);

  const handleExport = async () => {
    if (pending.current) return;
    pending.current = true;
    setExporting(true);
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

      const result = await createListCopy("רשימת קניות", activeItems, user.id);
      const newList = result.list;

      // Archive the old list
      const { error: archiveError } = await supabase
        .from("shopping_lists")
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq("id", listId).select("id").single();

      if (archiveError) {
        toast({ title: "הפריטים הועתקו", description: "הרשימה החדשה נשמרה, אך הישנה לא הועברה להיסטוריה. אפשר לנסות להעביר אותה שוב מהמסך של הרשימות.", variant: "destructive" });
        onExport(newList.id);
        return;
      }

      void logActivity('list_created', { list_id: newList.id, exported_from: listId });

      toast({
        title: "רשימה חדשה נוצרה",
        description: `${result.added} פריטים פעילים הועברו לרשימה חדשה`,
      });

      if (result.duplicates || result.invalid) toast({ title: "פריטים שלא הועתקו", description: `דלגנו על ${result.duplicates} כפילויות ו־${result.invalid} פריטים לא תקינים` });
      onExport(newList.id);
    } catch (error) {
      console.error("Error exporting to new list:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה ליצור רשימה חדשה",
        variant: "destructive",
      });
    } finally {
      pending.current = false;
      setExporting(false);
    }
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExport}
        disabled={exporting}
        className="h-11 w-11 rounded-lg shrink-0"
        aria-label="ייצא את הפריטים שנותרו לרשימה חדשה"
        title="ייצא את הפריטים שנותרו לרשימה חדשה"
      >
        <FileOutput size={16} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
        disabled={exporting}
      className="gap-2"
    >
      <FileOutput size={16} />
      ייצא לרשימה חדשה
    </Button>
  );
};

