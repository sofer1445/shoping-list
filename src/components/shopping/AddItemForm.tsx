import React, { useState, useEffect } from "react";
import { Plus, List } from "lucide-react";
import { ShoppingItem } from "./types";
import { RecommendationSystem } from "@/utils/RecommendationSystem";
import { Recommendations } from "./Recommendations";
import { BulkAddForm } from "./BulkAddForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddItemFormProps {
  onAdd: (item: Omit<ShoppingItem, "id" | "completed" | "isNew">) => void;
  categories: string[];
  items: ShoppingItem[];
}

export const AddItemForm = ({ onAdd, categories, items }: AddItemFormProps) => {
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
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="single" className="flex items-center gap-2 rounded-lg py-2">
            <Plus size={16} />
            פריט יחיד
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2 rounded-lg py-2">
            <List size={16} />
            הוספה מרובה
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                min="1"
                className="w-20 text-center font-bold h-12 rounded-xl"
              />
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="מה להוסיף?"
                className="flex-1 h-12 rounded-xl text-[16px]"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 rounded-xl text-[15px] bg-background">
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-right">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20"
              disabled={!newItemName.trim()}
            >
              <span>הוסף לרשימה</span>
              <Plus size={20} strokeWidth={3} />
            </Button>
          </form>

          <Recommendations
            recommendations={recommendations}
            onSelect={handleRecommendationSelect}
            onDismiss={handleRecommendationDismiss}
            className="mt-4"
          />
        </TabsContent>
        
        <TabsContent value="bulk" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <BulkAddForm onAdd={onAdd} categories={categories} items={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
