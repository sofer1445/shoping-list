import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { SearchBar } from "./shopping/SearchBar";
import { AddItemForm } from "./shopping/AddItemForm";
import { FilterButtons } from "./shopping/FilterButtons";
import { SortableItem } from "./shopping/SortableItem";
import { EditItemDialog } from "./shopping/EditItemDialog";
import { ArchivedLists } from "./shopping/ArchivedLists";
import { SharedLists } from "./shopping/SharedLists";
import { ArchiveButton } from "./shopping/ArchiveButton";
import { ShareListDialog } from "./shopping/ShareListDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useShoppingList } from "./shopping/hooks/useShoppingList";
import { useShoppingItems } from "./shopping/hooks/useShoppingItems";
import { ShoppingItem } from "./shopping/types";
import { useSearchParams } from "react-router-dom";

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];

export const ShoppingList = () => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const {
    items,
    setItems,
    currentListId,
    setCurrentListId,
  } = useShoppingList();

  useEffect(() => {
    const listId = searchParams.get("list");
    if (listId) {
      setCurrentListId(listId);
    }
  }, [searchParams]);

  const {
    addItem,
    toggleItem,
    deleteItem,
    handleSaveEdit,
  } = useShoppingItems(items, setItems, currentListId);

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

    return matchesFilter && matchesSearch;
  });

  const handleArchive = () => {
    setCurrentListId(null);
  };

  const renderShoppingList = (isSharedList: boolean = false) => (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {!isSharedList && (
            <>
              <ArchiveButton listId={currentListId!} onArchive={handleArchive} />
              <ShareListDialog listId={currentListId!} />
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold">
          {isSharedList ? "רשימה משותפת" : "רשימת קניות"}
        </h1>
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
    </>
  );

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-white">
      <Tabs defaultValue="current">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="current" className="flex-1">רשימה נוכחית</TabsTrigger>
          <TabsTrigger value="shared" className="flex-1">רשימות משותפות</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">ארכיון</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {renderShoppingList(false)}
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