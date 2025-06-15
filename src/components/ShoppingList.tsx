
import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { SmartSearch } from "./shopping/SmartSearch";
import { AddItemForm } from "./shopping/AddItemForm";
import { FilterButtons } from "./shopping/FilterButtons";
import { SortableItem } from "./shopping/SortableItem";
import { EditItemDialog } from "./shopping/EditItemDialog";
import { ArchivedLists } from "./shopping/ArchivedLists";
import { SharedLists } from "./shopping/SharedLists";
import { ArchiveButton } from "./shopping/ArchiveButton";
import { ShareListDialog } from "./shopping/ShareListDialog";
import { Statistics } from "./shopping/Statistics";
import { SmartRecommendations } from "./shopping/SmartRecommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useShoppingList } from "./shopping/hooks/useShoppingList";
import { useShoppingItems } from "./shopping/hooks/useShoppingItems";
import { ShoppingItem } from "./shopping/types";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, CloudOff, BarChart3 } from "lucide-react";

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];

export const ShoppingList = () => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [activeTab, setActiveTab] = useState("current");

  const {
    items,
    setItems,
    currentListId,
    setCurrentListId,
    fetchItems,
    isLoading,
    hasError,
    isOfflineMode
  } = useShoppingList();

  const {
    addItem,
    toggleItem,
    deleteItem,
    handleSaveEdit,
  } = useShoppingItems(items, setItems, currentListId);

  useEffect(() => {
    const listId = searchParams.get("list");
    if (listId) {
      setCurrentListId(listId);
      setActiveTab("shared");
    }
  }, [searchParams]);

  // Add event listener for shopping list updates
  useEffect(() => {
    const handleListUpdate = () => {
      if (currentListId) {
        fetchItems();
      }
    };

    window.addEventListener('shopping-list-updated', handleListUpdate);
    return () => {
      window.removeEventListener('shopping-list-updated', handleListUpdate);
    };
  }, [currentListId, fetchItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

    const matchesCategory = selectedCategory === null || item.category === selectedCategory;

    return matchesFilter && matchesSearch && matchesCategory;
  });

  const renderShoppingList = (isSharedList: boolean = false) => (
    <>
      {isOfflineMode && (
        <Alert className="mb-4">
          <CloudOff className="h-4 w-4" />
          <AlertTitle>מצב לא מקוון</AlertTitle>
          <AlertDescription>
            הנתונים מוצגים ממקור מקומי. חלק מהפעולות עלולות לא לעבוד.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {!isSharedList && (
            <>
              <ArchiveButton listId={currentListId!} onArchive={() => setCurrentListId(null)} />
              <ShareListDialog listId={currentListId!} />
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold">
          {isSharedList ? "רשימה משותפת" : "רשימת קניות"}
        </h1>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <SmartSearch
          searchQuery={searchQuery}
          items={items}
          onSearch={setSearchQuery}
          onFilterByCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
        />

        <AddItemForm onAdd={addItem} categories={categories} />

        <SmartRecommendations
          items={items}
          onAddItem={addItem}
          categories={categories}
        />
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
    </>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>שגיאה</AlertTitle>
          <AlertDescription>
            לא ניתן לטעון את רשימת הקניות. אנא נסה שוב מאוחר יותר.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="current" className="flex-1">רשימה נוכחית</TabsTrigger>
          <TabsTrigger value="statistics" className="flex-1">
            <BarChart3 className="h-4 w-4 ml-1" />
            סטטיסטיקות
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex-1">רשימות משותפות</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">ארכיון</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {currentListId && !searchParams.get("list") && renderShoppingList(false)}
        </TabsContent>

        <TabsContent value="statistics">
          <Statistics items={items} />
        </TabsContent>

        <TabsContent value="shared">
          {searchParams.get("list") ? (
            renderShoppingList(true)
          ) : (
            <SharedLists />
          )}
        </TabsContent>

        <TabsContent value="archived">
          <ArchivedLists />
        </TabsContent>
      </Tabs>
    </div>
  );
};
