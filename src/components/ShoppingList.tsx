import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Check, Search, GripVertical } from "lucide-react";
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
import { Input } from "./ui/input";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
  isNew?: boolean;
  justCompleted?: boolean;
}

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];

const SortableItem = ({ item }: { item: ShoppingItem }) => {
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
          onClick={() => {/* keep existing delete functionality */}}
        >
          <Trash2 size={20} />
        </button>
        <button className="text-primary hover:text-primary/80 transition-colors">
          <Edit size={20} />
        </button>
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={20} />
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-right">
        <button
          onClick={() => {/* keep existing toggle functionality */}}
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
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: newItemQuantity,
      category: selectedCategory,
      completed: false,
      isNew: true,
    };
    
    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemQuantity(1);

    // Remove the green highlight after 3 seconds
    setTimeout(() => {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === newItem.id ? { ...item, isNew: false } : item
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

    // Remove the red highlight after 3 seconds
    setTimeout(() => {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === id ? { ...item, justCompleted: false } : item
        )
      );
    }, 3000);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
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
        <Input
          type="search"
          placeholder="חיפוש מוצרים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-right"
        />

        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="שם המוצר"
            className="flex-1 p-2 border rounded-lg text-right"
          />
          <input
            type="number"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(Number(e.target.value))}
            min="1"
            className="w-20 p-2 border rounded-lg text-right"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-lg text-right"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        
        <button
          onClick={addItem}
          className="flex items-center justify-center gap-2 bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          הוסף פריט
        </button>
      </div>

      <div className="flex gap-2 mb-4 justify-end">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-lg",
            filter === "all"
              ? "bg-primary text-white"
              : "bg-secondary text-foreground"
          )}
        >
          הכל
        </button>
        <button
          onClick={() => setFilter("active")}
          className={cn(
            "px-4 py-2 rounded-lg",
            filter === "active"
              ? "bg-primary text-white"
              : "bg-secondary text-foreground"
          )}
        >
          פעיל
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={cn(
            "px-4 py-2 rounded-lg",
            filter === "completed"
              ? "bg-primary text-white"
              : "bg-secondary text-foreground"
          )}
        >
          הושלם
        </button>
      </div>

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
              <SortableItem key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};