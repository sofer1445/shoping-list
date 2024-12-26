import React, { useState } from "react";
import { Plus, Trash2, Edit, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
}

const categories = ["מזון", "ירקות ופירות", "מוצרי חלב", "ניקיון", "אחר"];

export const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: newItemQuantity,
      category: selectedCategory,
      completed: false,
    };
    
    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemQuantity(1);
  };

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const filteredItems = items.filter((item) => {
    if (filter === "active") return !item.completed;
    if (filter === "completed") return item.completed;
    return true;
  });

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-white">
      <h1 className="text-2xl font-bold text-right mb-6">רשימת קניות</h1>
      
      <div className="flex flex-col gap-4 mb-6">
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

      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border animate-fadeIn",
              item.completed ? "bg-secondary" : "bg-white"
            )}
          >
            <div className="flex gap-2">
              <button
                onClick={() => deleteItem(item.id)}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 size={20} />
              </button>
              <button className="text-primary hover:text-primary/80 transition-colors">
                <Edit size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-right">
              <button
                onClick={() => toggleItem(item.id)}
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
        ))}
      </div>
    </div>
  );
};