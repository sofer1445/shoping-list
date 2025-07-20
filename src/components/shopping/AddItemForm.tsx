
import React, { useState, useEffect } from "react";
import { Plus, List } from "lucide-react";
import { ShoppingItem } from "./types";
import { RecommendationSystem } from "@/utils/RecommendationSystem";
import { Recommendations } from "./Recommendations";
import { BulkAddForm } from "./BulkAddForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddItemFormProps {
  onAdd: (item: Omit<ShoppingItem, "id" | "completed" | "isNew">) => void;
  categories: string[];
}

export const AddItemForm = ({ onAdd, categories }: AddItemFormProps) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationSystem] = useState(() => new RecommendationSystem());

  useEffect(() => {
    if (newItemName) {
      setRecommendations(recommendationSystem.getRecommendations(newItemName));
    } else {
      setRecommendations([]);
    }
  }, [newItemName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAdd({
      name: newItemName,
      quantity: newItemQuantity,
      category: selectedCategory,
    });

    // Update recommendation system with the new item
    recommendationSystem.addPurchaseData([newItemName]);
    
    setNewItemName("");
    setNewItemQuantity(1);
    setRecommendations([]);
  };

  const handleRecommendationSelect = (item: string) => {
    onAdd({
      name: item,
      quantity: 1,
      category: categories[0],
    });
    recommendationSystem.addPurchaseData([newItemName, item]);
  };

  const handleRecommendationDismiss = (item: string) => {
    setRecommendations(prev => prev.filter(rec => rec !== item));
  };

  return (
    <div className="w-full" dir="rtl">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Plus size={16} />
            פריט יחיד
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <List size={16} />
            הוספה מרובה
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                min="1"
                className="w-20 p-3 border rounded-lg text-right font-medium"
                style={{ direction: 'rtl' }}
              />
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="שם המוצר"
                className="flex-1 p-3 border rounded-lg text-right font-medium"
                style={{ direction: 'rtl' }}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 border rounded-lg text-right font-medium"
              style={{ direction: 'rtl' }}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-primary text-white p-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <span>הוסף פריט</span>
              <Plus size={20} />
            </button>
          </form>

          <Recommendations
            recommendations={recommendations}
            onSelect={handleRecommendationSelect}
            onDismiss={handleRecommendationDismiss}
            className="mt-4"
          />
        </TabsContent>
        
        <TabsContent value="bulk">
          <BulkAddForm onAdd={onAdd} categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
