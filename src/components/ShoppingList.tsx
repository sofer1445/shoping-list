import React, { useState, useEffect } from "react";
import { Trash2, Edit, Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SearchBar } from "./shopping/SearchBar";
import { AddItemForm } from "./shopping/AddItemForm";
import { FilterButtons } from "./shopping/FilterButtons";
import { ShoppingItem } from "./shopping/types";
import { useToast } from "./ui/use-toast";

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];

const SortableItem = ({
  item,
  onDelete,
  onToggle,
  onEdit,
}: {
  item: ShoppingItem;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border animate-fadeIn transition-colors",
        item.completed ? "bg-secondary" : "bg-white",
        item.isNew && "bg-green-100",
        item.justCompleted && "bg-red-100"
      )}
    >
      <div className="flex gap-2">
        <button
          className="text-destructive hover:text-destructive/80 transition-colors"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 size={20} />
        </button>
        <button
          className="text-primary hover:text-primary/80 transition-colors"
          onClick={() => onEdit(item.id)}
        >
          <Edit size={20} />
        </button>
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={20} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-right">
        <button
          onClick={() => onToggle(item.id)}
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            item.completed
              ? "border-primary bg-primary text-white"
              : "border-gray-300"
          )}
        >
          {item.completed && <Check size={16} />}
        </button>
        <div>
          <div className={cn(item.completed && "line-through")}>
            {item.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {item.category} • {item.quantity}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const savedItems = localStorage.getItem("shoppingItems");
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("shoppingItems", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<ShoppingItem, "id" | "completed" | "isNew">) => {
    const item: ShoppingItem = {
      ...newItem,
      id: Date.now().toString(),
      completed: false,
      isNew: true,
    };

    setItems([...items, item]);
    toast({
      title: "פריט נוסף",
      description: `${item.name} נוסף לרשימה`,
    });

    setTimeout(() => {
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, isNew: false } : i
        )
      );
    }, 3000);
  };

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, completed: !item.completed, justCompleted: !item.completed }
          : item
      )
    );

    setTimeout(() => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, justCompleted: false } : item
        )
      );
    }, 3000);
  };

  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setItems(items.filter((i) => i.id !== id));
      toast({
        title: "פריט נמחק",
        description: `${item.name} הוסר מהרשימה`,
      });
    }
  };

  const editItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      // For now, we'll just show a toast. In a future update, we can add an edit modal
      toast({
        title: "עריכת פריט",
        description: "פונקציונליות העריכה תתווסף בקרוב",
      });
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSearchSelect = (itemName: string) => {
    setSearchQuery(itemName);
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

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-white">
      <h1 className="text-2xl font-bold text-right mb-6">רשימת קניות</h1>

      <div className="flex flex-col gap-4 mb-6">
        <SearchBar
          searchQuery={searchQuery}
          items={items}
          onSearch={setSearchQuery}
          onSelectSuggestion={handleSearchSelect}
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
                onEdit={editItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};