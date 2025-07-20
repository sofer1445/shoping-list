import React, { useState } from "react";
import { List, Wand2 } from "lucide-react";
import { ShoppingItem } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BulkAddFormProps {
  onAdd: (item: Omit<ShoppingItem, "id" | "completed" | "isNew">) => void;
  categories: string[];
}

export const BulkAddForm = ({ onAdd, categories }: BulkAddFormProps) => {
  const [bulkItems, setBulkItems] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // מיפוי פריטים לקטגוריות - יכול להיות מורחב או משופר עם AI
  const categoryMapping: Record<string, string> = {
    // ירקות ופירות
    'עגבניה': 'ירקות ופירות',
    'מלפפון': 'ירקות ופירות',
    'לימון': 'ירקות ופירות',
    'בצל': 'ירקות ופירות',
    'תפוח': 'ירקות ופירות',
    'בננה': 'ירקות ופירות',
    'גזר': 'ירקות ופירות',
    'חסה': 'ירקות ופירות',
    'תפוח אדמה': 'ירקות ופירות',
    'פטרוזיליה': 'ירקות ופירות',
    'שום': 'ירקות ופירות',
    
    // חלב וביצים
    'חלב': 'חלב וביצים',
    'ביצים': 'חלב וביצים',
    'גבינה': 'חלב וביצים',
    'יוגורט': 'חלב וביצים',
    'חמאה': 'חלב וביצים',
    'קוטג': 'חלב וביצים',
    
    // בשר ודגים
    'עוף': 'בשר ודגים',
    'בקר': 'בשר ודגים',
    'טונה': 'בשר ודגים',
    'סלמון': 'בשר ודגים',
    'נקניק': 'בשר ודגים',
    
    // מוצרי ניקיון
    'סבון': 'מוצרי ניקיון',
    'נייר טואלט': 'מוצרי ניקיון',
    'מטליות': 'מוצרי ניקיון',
    
    // אחר
    'לחם': 'אחר',
    'אורז': 'אחר',
    'פסטה': 'אחר',
    'שמן': 'אחר',
  };

  const getCategory = (itemName: string): string => {
    const cleanName = itemName.trim().toLowerCase();
    
    // חיפוש מדויק
    if (categoryMapping[cleanName]) {
      return categoryMapping[cleanName];
    }
    
    // חיפוש חלקי
    for (const [key, category] of Object.entries(categoryMapping)) {
      if (cleanName.includes(key) || key.includes(cleanName)) {
        return category;
      }
    }
    
    return categories[0] || 'אחר';
  };

  const handleBulkAdd = async () => {
    if (!bulkItems.trim()) return;
    
    setIsProcessing(true);
    
    const items = bulkItems
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(itemName => {
        // בדיקה אם יש כמות מצוינת (לדוגמה: "עגבניות 2")
        const match = itemName.match(/^(.+?)\s+(\d+)$/);
        const name = match ? match[1].trim() : itemName;
        const quantity = match ? parseInt(match[2]) : 1;
        
        return {
          name,
          quantity,
          category: getCategory(name),
        };
      });

    // הוספת הפריטים אחד אחר השני עם השהיה קטנה לחוויה טובה יותר
    for (const item of items) {
      onAdd(item);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setBulkItems("");
    setIsProcessing(false);
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <List size={20} />
          הוספה מרובה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            הכנס פריטים (פריט אחד בכל שורה)
          </label>
          <Textarea
            value={bulkItems}
            onChange={(e) => setBulkItems(e.target.value)}
            placeholder="עגבניה&#10;מלפפון 2&#10;לחם&#10;חלב"
            className="min-h-[120px] text-right font-medium resize-none"
            style={{ direction: 'rtl' }}
          />
          <div className="text-xs text-muted-foreground">
            טיפ: ניתן לציין כמות לאחר שם הפריט (לדוגמה: "עגבניות 3")
          </div>
        </div>
        
        <Button
          onClick={handleBulkAdd}
          disabled={!bulkItems.trim() || isProcessing}
          className="w-full flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              מוסיף פריטים...
            </>
          ) : (
            <>
              <Wand2 size={16} />
              הוסף את כל הפריטים
            </>
          )}
        </Button>
        
        {bulkItems.trim() && (
          <div className="text-sm text-muted-foreground">
            {bulkItems.split('\n').filter(line => line.trim()).length} פריטים מוכנים להוספה
          </div>
        )}
      </CardContent>
    </Card>
  );
};