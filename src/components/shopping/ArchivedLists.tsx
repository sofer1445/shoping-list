import { useEffect, useState } from "react";
import { ArchiveRestore } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ArchivedList {
  id: string;
  name: string;
  archived_at: string;
}

export const ArchivedLists = () => {
  const [archivedLists, setArchivedLists] = useState<ArchivedList[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchArchivedLists();
  }, []);

  const fetchArchivedLists = async () => {
    try {
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("id, name, archived_at")
        .eq("archived", true)
        .order("archived_at", { ascending: false });

      if (error) throw error;
      setArchivedLists(data || []);
    } catch (error) {
      console.error("Error fetching archived lists:", error);
    }
  };

  const handleRestore = async (listId: string) => {
    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({
          archived: false,
          archived_at: null,
        })
        .eq("id", listId);

      if (error) throw error;

      toast({
        title: "רשימה שוחזרה",
        description: "הרשימה שוחזרה בהצלחה",
      });

      fetchArchivedLists();
    } catch (error) {
      console.error("Error restoring list:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לשחזר את הרשימה",
        variant: "destructive",
      });
    }
  };

  if (archivedLists.length === 0) {
    return <div className="text-center text-muted-foreground">אין רשימות בארכיון</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-right">רשימות בארכיון</h2>
      <div className="space-y-2">
        {archivedLists.map((list) => (
          <div
            key={list.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestore(list.id)}
              className="gap-2"
            >
              <ArchiveRestore size={16} />
              שחזר
            </Button>
            <div className="text-right">
              <div className="font-medium">{list.name}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(list.archived_at), "dd/MM/yyyy HH:mm")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};