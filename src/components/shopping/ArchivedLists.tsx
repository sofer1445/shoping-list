import { useEffect, useState } from "react";
import { ArchiveRestore } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ArchivedList {
  id: string;
  name: string;
  archived_at: string;
}

export const ArchivedLists = () => {
  const [archivedLists, setArchivedLists] = useState<ArchivedList[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Refresh the archived lists
      fetchArchivedLists();
      
      // Redirect to the main page to show the restored list
      navigate("/");
      // Force a reload to refresh the current lists
      window.location.reload();
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
    return (
      <div className="text-center text-muted-foreground p-4">
        אין רשימות בארכיון
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      <h2 className="text-xl font-semibold text-right mb-6">רשימות בארכיון</h2>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {archivedLists.map((list) => (
          <div
            key={list.id}
            className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-lg border gap-4"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestore(list.id)}
              className="w-full sm:w-auto gap-2"
            >
              <ArchiveRestore size={16} />
              שחזר
            </Button>
            <div className="text-center sm:text-right">
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