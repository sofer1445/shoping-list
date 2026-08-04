import React, { useState } from "react";
import { List, Wand2, Sparkles } from "lucide-react";
import { ShoppingItem } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface BulkAddFormProps {
  onAdd: (item: Omit<ShoppingItem, "id" | "completed" | "isNew">) => void;
  categories: string[];
  items: ShoppingItem[];
}

export const BulkAddForm = ({ onAdd, categories, items }: BulkAddFormProps) => {
  const [bulkItems, setBulkItems] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const categoryMapping: Record<string, string> = {
    'עגבניה': 'ירקות ופירות',
    'מלפפון': 'ירקות ופירות',
    'חלב': 'מוצרי חלב',
    'ביצים': 'מוצרי חלב',
    'גבינה': 'מוצרי חלב',
    'לחם': 'מזון',
    'אורז': 'מזון',
    'פסטה': 'מזון',
    'סבון': 'ניקיון',
    'נייר טואלט': 'ניקיון',
  };

  const getCategory = (itemName: string): string => {
    const cleanName = itemName.trim().toLowerCase();
    for (const [key, category] of Object.entries(categoryMapping)) {
      if (cleanName.includes(key)) return category;
    }
    return categories[categories.length - 1] || 'אחר';
  };

  const handleBulkAdd = async () => {
    if (!bulkItems.trim()) return;
    setIsProcessing(true);
    
    const lines = bulkItems.split('\n').map(l => l.trim()).filter(Boolean);
    const existingItemNames = new Set(items.filter(i => !i.completed).map(i => i.name.toLowerCase()));
    
    let addedCount = 0;
    let skipCount = 0;

    for (const line of lines) {
      const match = line.match(/^(.+?)\s+(\d+)$/);
      const name = match ? match[1].trim() : line;
      const quantity = match ? parseInt(match[2]) : 1;

      if (existingItemNames.has(name.toLowerCase())) {
        skipCount++;
        continue;
      }

      onAdd({
        name,
        quantity,
        category: getCategory(name),
      });
      addedCount++;
    }

    setBulkItems("");
    setIsProcessing(false);
    
    if (addedCount > 0) {
      toast({
        title: "הפעולה הושלמה",
        description: `נוספו ${addedCount} פריטים לרשימה`,
      });
    }
    if (skipCount > 0) {
      toast({
        title: "פריטים כפולים",
        description: `דלגנו על ${skipCount} פריטים שכבר קיימים`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full border-border/60 shadow-sm rounded-2xl overflow-hidden" dir="rtl">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-[17px] font-display">
          <Sparkles size={18} className="text-primary" />
          הוספה חכמה
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] text-muted-foreground">פריט אחד בכל שורה</span>
            <label className="text-xs font-bold text-foreground">רשימת מוצרים</label>
          </div>
          <Textarea
            value={bulkItems}
            onChange={(e) => setBulkItems(e.target.value)}
            placeholder="חלב&#10;לחם 2&#10;עגבניות"
            className="min-h-[140px] text-right font-medium resize-none rounded-xl border-border/60 focus:ring-primary/20"
          />
        </div>
        
        <Button
          onClick={handleBulkAdd}
          disabled={!bulkItems.trim() || isProcessing}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
        >
          {isProcessing ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Wand2 size={18} />
              הוסף פריטים
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
