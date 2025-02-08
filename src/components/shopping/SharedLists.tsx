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
  created_by: string;
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
    if (!user) {
      console.error("No authenticated user found");
      return;
    }

    try {
      setIsLoading(true);
      
      // Debug: Log current user
      console.log("Current user:", user.id);
      
      // קודם נבדוק אם יש למשתמש פרופיל
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast({
          title: "שגיאה",
          description: "לא ניתן למצוא את פרופיל המשתמש",
          variant: "destructive",
        });
        return;
      }

      console.log("Profile found:", profileData);

      // כעת נביא את הרשימות המשותפות
      console.log("Fetching shared lists for user:", user.id);
      const { data, error } = await supabase
        .from("shopping_lists")
        .select(`
          id,
          name,
          created_by,
          list_shares!list_shares_list_id_fkey (
            permission,
            shared_with
          ),
          profiles!shopping_lists_created_by_fkey (
            username
          )
        `)
        .eq('list_shares.shared_with', user.id)
        .eq('archived', false);

      if (error) {
        console.error("Error fetching shared lists:", error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הרשימות המשותפות",
          variant: "destructive",
        });
        return;
      }

      console.log("Raw shared lists data:", data);

      if (data) {
        const formattedLists = data.map((list) => ({
          id: list.id,
          name: list.name,
          shared_by: {
            username: list.profiles?.username || 'משתמש לא ידוע'
          },
          permission: list.list_shares[0]?.permission || 'view',
          created_by: list.created_by
        }));
        
        console.log("Formatted shared lists:", formattedLists);
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
