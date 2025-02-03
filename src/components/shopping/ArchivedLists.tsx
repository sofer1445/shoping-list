import { useEffect, useState } from "react";
import { ArchiveRestore, MoveRight } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { ShoppingItem } from "./types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ArchivedList {
  id: string;
  name: string;
  archived_at: string;
  items?: ShoppingItem[];
}

export const ArchivedLists = () => {
  const [archivedLists, setArchivedLists] = useState<ArchivedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchArchivedLists();
    }
  }, [user]);

  const fetchArchivedLists = async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error("No authenticated user found");
      }

      const { data: lists, error: listsError } = await supabase
        .from("shopping_lists")
        .select("id, name, archived_at")
        .eq("archived", true)
        .eq("created_by", user.id)
        .order("archived_at", { ascending: false });

      if (listsError) throw listsError;

      const listsWithItems = await Promise.all(
        (lists || []).map(async (list) => {
          const { data: items } = await supabase
            .from("shopping_items")
            .select("*")
            .eq("list_id", list.id)
            .order("created_at", { ascending: true });

          return {
            ...list,
            items: items || [],
          };
        })
      );

      setArchivedLists(listsWithItems);
    } catch (error) {
      console.error("Error fetching archived lists:", error);
      
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchArchivedLists(retryCount + 1), delay);
      } else {
        setError("לא ניתן היה לטעון את הרשימות המאורכבות. אנא נסה שוב מאוחר יותר.");
        toast({
          title: "שגיאה",
          description: "לא ניתן היה לטעון את הרשימות המאורכבות",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({
          archived: false,
          archived_at: null,
        })
        .eq("id", listId)
        .eq("created_by", user?.id);

      if (error) throw error;

      const { error: itemsError } = await supabase
        .from("shopping_items")
        .update({
          archived: false,
          archived_at: null,
        })
        .eq("list_id", listId);

      if (itemsError) throw itemsError;

      toast({
        title: "רשימה שוחזרה",
        description: "הרשימה שוחזרה בהצלחה",
      });

      fetchArchivedLists();
      window.dispatchEvent(new CustomEvent('shopping-list-updated'));
      navigate("/");
    } catch (error) {
      console.error("Error restoring list:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לשחזר את הרשימה",
        variant: "destructive",
      });
    }
  };

  const handleRestoreItem = async (item: ShoppingItem) => {
    try {
      const { data: currentList } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("created_by", user?.id)
        .eq("archived", false)
        .single();

      if (!currentList) {
        toast({
          title: "שגיאה",
          description: "לא נמצאה רשימה פעילה",
          variant: "destructive",
        });
        return;
      }

      // Create a new item in the current list
      const { error: createError } = await supabase
        .from("shopping_items")
        .insert({
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          list_id: currentList.id,
          created_by: user?.id,
        });

      if (createError) throw createError;

      toast({
        title: "פריט שוחזר",
        description: `${item.name} הועבר לרשימה הנוכחית`,
      });

      // Force a refresh of the current list
      window.dispatchEvent(new CustomEvent('shopping-list-updated'));
      
      // Update selected items state
      setSelectedItems(prev => ({ ...prev, [item.id]: false }));
    } catch (error) {
      console.error("Error restoring item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לשחזר את הפריט",
        variant: "destructive",
      });
    }
  };

  const handleMoveSelectedItems = async (listId: string) => {
    const itemsToMove = archivedLists
      .find(list => list.id === listId)
      ?.items?.filter(item => selectedItems[item.id]) || [];

    for (const item of itemsToMove) {
      await handleRestoreItem(item);
    }

    // Clear selection after moving
    setSelectedItems({});
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground p-4">
        טוען רשימות...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => fetchArchivedLists()}
          className="mx-auto"
        >
          נסה שוב
        </Button>
      </div>
    );
  }

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
      <Accordion type="multiple" className="space-y-4">
        {archivedLists.map((list) => (
          <AccordionItem key={list.id} value={list.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestoreList(list.id);
                  }}
                  className="gap-2"
                >
                  <ArchiveRestore size={16} />
                  שחזר רשימה
                </Button>
                {Object.values(selectedItems).some(Boolean) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveSelectedItems(list.id);
                    }}
                    className="gap-2"
                  >
                    <MoveRight size={16} />
                    העבר לרשימה נוכחית
                  </Button>
                )}
              </div>
              <div className="text-right">
                <AccordionTrigger className="hover:no-underline">
                  <div>
                    <div className="font-medium">{list.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(list.archived_at), "dd/MM/yyyy HH:mm")}
                    </div>
                  </div>
                </AccordionTrigger>
              </div>
            </div>
            <AccordionContent>
              <div className="mt-4 space-y-2">
                {list.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems[item.id] || false}
                        onChange={(e) => {
                          setSelectedItems(prev => ({
                            ...prev,
                            [item.id]: e.target.checked
                          }));
                        }}
                        className="h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreItem(item)}
                        className="gap-2"
                      >
                        <ArchiveRestore size={16} />
                        שחזר פריט
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category} • {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};