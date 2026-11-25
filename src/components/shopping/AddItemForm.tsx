import React, { useState, useEffect } from "react";
import { Plus, List } from "lucide-react";
import { ShoppingItem } from "./types";
import { RecommendationSystem } from "@/utils/RecommendationSystem";
import { Recommendations } from "./Recommendations";
import { BulkAddForm } from "./BulkAddForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hasDuplicateItem, isValidQuantity } from "@/utils/shoppingValidation";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddItemFormProps {
  onAdd: (item: Omit<ShoppingItem, "id" | "completed" | "isNew">) => Promise<boolean>;
  categories: string[];
  items: ShoppingItem[];
}

export const AddItemForm = ({ onAdd, categories, items }: AddItemFormProps) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationSystem] = useState(() => new RecommendationSystem());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const duplicate = hasDuplicateItem(items, newItemName);

  useEffect(() => {
    if (newItemName) {
      setRecommendations(recommendationSystem.getRecommendations(newItemName).filter((name) => !hasDuplicateItem(items, name)));
    } else {
      setRecommendations([]);
    }
  }, [newItemName, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = newItemName.trim().toLocaleLowerCase("he");
    if (!normalizedName || !isValidQuantity(newItemQuantity) || duplicate || saving) return;

    setSaving(true);
    try {
    const saved = await onAdd({
      name: newItemName.trim(),
      quantity: newItemQuantity,
      category: selectedCategory,
    });
    if (!saved) return;

    recommendationSystem.addPurchaseData([newItemName]);
    
    setNewItemName("");
    setNewItemQuantity(1);
    setRecommendations([]);
    } catch {
      toast({ title: "הפריט לא נוסף", description: "נסה שוב. הפרטים שהזנת נשמרו בטופס", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleRecommendationSelect = async (item: string) => {
    if (saving || hasDuplicateItem(items, item)) return;
    setSaving(true);
    try {
    const saved = await onAdd({
      name: item,
      quantity: 1,
      category: categories[0],
    });
    if (saved) recommendationSystem.addPurchaseData([newItemName, item]);
    } catch {
      toast({ title: "הפריט לא נוסף", description: "נסה שוב", variant: "destructive" });
    } finally { setSaving(false); }
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
                aria-label="כמות"
                disabled={saving}
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                min="1"
                step="1"
                className="w-20 text-center font-bold h-12 rounded-xl"
              />
              <Input
                type="text"
                aria-label="שם הפריט"
                disabled={saving}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="מה להוסיף?"
                className="flex-1 min-w-0 h-12 rounded-xl text-[16px]"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={saving}>
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

            {duplicate && <p role="status" className="text-sm text-destructive">הפריט כבר נמצא ברשימה</p>}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20"
              disabled={
                !newItemName.trim() ||
                !isValidQuantity(newItemQuantity) || saving || duplicate
              }
            >
              <span>{saving ? "מוסיף..." : "הוסף לרשימה"}</span>
              <Plus size={20} strokeWidth={3} />
            </Button>
          </form>

          <Recommendations
            disabled={saving}
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
