import React, { useState } from "react";
import { Plus } from "lucide-react";
import { ShoppingItem } from "./types";

interface AddItemFormProps {
  onAdd: (item: Omit<ShoppingItem, "id" | "completed" | "isNew">) => void;
  categories: string[];
}

export const AddItemForm = ({ onAdd, categories }: AddItemFormProps) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAdd({
      name: newItemName,
      quantity: newItemQuantity,
      category: selectedCategory,
    });

    setNewItemName("");
    setNewItemQuantity(1);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        type="submit"
        className="flex items-center justify-center gap-2 bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Plus size={20} />
        הוסף פריט
      </button>
    </form>
  );
};