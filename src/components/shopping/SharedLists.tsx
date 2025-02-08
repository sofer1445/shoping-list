import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface SharedList {
  id: string;
  name: string;
  shared_by: {
    username: string;
  };
  permission: "view" | "edit";
}

export const SharedLists = () => {
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSharedLists();
    }
  }, [user]);

  const fetchSharedLists = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("list_shares")
        .select(`
          list_id,
          permission,
          shopping_lists!inner (
            id,
            name
          ),
          profiles!list_shares_created_by_fkey (
            username
          )
        `)
        .eq("shared_with", user?.id);

      if (error) throw error;

      if (data) {
        const formattedLists = data.map((share) => ({
          id: share.shopping_lists.id,
          name: share.shopping_lists.name,
          shared_by: {
            username: share.profiles.username
          },
          permission: share.permission,
        }));
        setSharedLists(formattedLists);
      }
    } catch (error) {
      console.error("Error fetching shared lists:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לטעון את הרשימות המשותפות",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleListClick = (listId: string) => {
    navigate(`/?list=${listId}`);
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground p-4">
        טוען רשימות...
      </div>
    );
  }

  if (sharedLists.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        אין רשימות משותפות
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      <h2 className="text-xl font-semibold text-right mb-6">רשימות משותפות</h2>
      <div className="grid gap-4">
        {sharedLists.map((list) => (
          <div
            key={list.id}
            onClick={() => handleListClick(list.id)}
            className="flex items-center justify-between p-4 bg-white rounded-lg border cursor-pointer hover:border-primary transition-colors"
          >
            <div className="text-sm text-muted-foreground">
              {list.permission === "edit" ? "עריכה מלאה" : "צפייה בלבד"}
            </div>
            <div className="text-right">
              <div className="font-medium">{list.name}</div>
              <div className="text-sm text-muted-foreground">
                שותף על ידי {list.shared_by.username}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};