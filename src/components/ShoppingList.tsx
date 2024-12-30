import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { SearchBar } from "./shopping/SearchBar";
import { AddItemForm } from "./shopping/AddItemForm";
import { FilterButtons } from "./shopping/FilterButtons";
import { SortableItem } from "./shopping/SortableItem";
import { EditItemDialog } from "./shopping/EditItemDialog";
import { ArchivedLists } from "./shopping/ArchivedLists";
import { ArchiveButton } from "./shopping/ArchiveButton";
import { ShoppingItem } from "./shopping/types";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];

export const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    createInitialList();
  }, []);

  const createInitialList = async () => {
    try {
      const { data: existingLists, error: fetchError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("archived", false)
        .limit(1);

      if (fetchError) throw fetchError;

      if (!existingLists?.length) {
        const { data: newList, error: createError } = await supabase
          .from("shopping_lists")
          .insert({ 
            name: "רשימת קניות",
            created_by: user?.id 
          })
          .select()
          .single();

        if (createError) throw createError;
        setCurrentListId(newList.id);
      } else {
        setCurrentListId(existingLists[0].id);
      }
    } catch (error) {
      console.error("Error creating/fetching list:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה ליצור רשימה חדשה",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (currentListId) {
      fetchItems();
    }
  }, [currentListId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("list_id", currentListId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const addItem = async (newItem: Omit<ShoppingItem, "id" | "completed" | "isNew">) => {
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          ...newItem,
          list_id: currentListId,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, { ...data, isNew: true }]);
      toast({
        title: "פריט נוסף",
        description: `${newItem.name} נוסף לרשימה`,
      });

      setTimeout(() => {
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === data.id ? { ...i, isNew: false } : i
          )
        );
      }, 3000);
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה להוסיף את הפריט",
        variant: "destructive",
      });
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({
          completed: !item.completed,
          completed_at: !item.completed ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === id
            ? { ...i, completed: !i.completed, justCompleted: !i.completed }
            : i
        )
      );

      setTimeout(() => {
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === id ? { ...i, justCompleted: false } : i
          )
        );
      }, 3000);
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const item = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (item) {
        toast({
          title: "פריט נמחק",
          description: `${item.name} הוסר מהרשימה`,
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה למחוק את הפריט",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async (updatedItem: ShoppingItem) => {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update(updatedItem)
        .eq("id", updatedItem.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );

      toast({
        title: "פריט עודכן",
        description: `${updatedItem.name} עודכן בהצלחה`,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לעדכן את הפריט",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !item.completed) ||
      (filter === "completed" && item.completed);

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleArchive = () => {
    setCurrentListId(null);
    createInitialList();
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-white">
      <Tabs defaultValue="current">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="current" className="flex-1">רשימה נוכחית</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">ארכיון</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="flex items-center justify-between mb-6">
            <ArchiveButton listId={currentListId!} onArchive={handleArchive} />
            <h1 className="text-2xl font-bold">רשימת קניות</h1>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <SearchBar
              searchQuery={searchQuery}
              items={items}
              onSearch={setSearchQuery}
              onSelectSuggestion={(itemName) => {
                const item = items.find(i => i.name === itemName);
                if (item) {
                  setEditingItem(item);
                }
              }}
            />

            <AddItemForm onAdd={addItem} categories={categories} />
          </div>

          <FilterButtons filter={filter} onFilterChange={setFilter} />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onDelete={deleteItem}
                    onToggle={toggleItem}
                    onEdit={() => setEditingItem(item)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <EditItemDialog
            item={editingItem}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveEdit}
            categories={categories}
          />
        </TabsContent>

        <TabsContent value="archived">
          <ArchivedLists />
        </TabsContent>
      </Tabs>
    </div>
  );
};