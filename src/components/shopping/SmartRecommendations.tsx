
import React, { useState, useEffect } from "react";
import { Lightbulb, X, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingItem } from "./types";
import { RecommendationSystem } from "@/utils/RecommendationSystem";

interface SmartRecommendationsProps {
  items: ShoppingItem[];
  onAddItem: (item: Omit<ShoppingItem, "id" | "completed" | "isNew">) => void;
  categories: string[];
}

export const SmartRecommendations = ({ 
  items, 
  onAddItem, 
  categories 
}: SmartRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [contextualRecs, setContextualRecs] = useState<string[]>([]);
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set());
  const [recommendationSystem] = useState(() => new RecommendationSystem());

  // Smart contextual recommendations based on current items
  const smartRecommendations = {
    'ירקות ופירות': ['עגבניות', 'מלפפונים', 'בצל', 'גזר', 'תפוחים', 'בננות'],
    'מזון': ['לחם', 'אורז', 'פסטה', 'שמן זית', 'מלח', 'פלפל'],
    'מוצרי חלב': ['חלב', 'גבינה צהובה', 'יוגורט', 'חמאה', 'שמנת'],
    'ניקיון': ['סבון כלים', 'נייר טואלט', 'משטח לרצפה', 'אקונומיקה'],
    'אחר': ['בישול', 'תבלינים', 'שמפו', 'משחת שיניים']
  };

  // Generate recommendations based on what's already in the list
  useEffect(() => {
    const currentItems = items.map(item => item.name);
    const currentCategories = [...new Set(items.map(item => item.category))];
    
    // Get traditional recommendations
    const traditionalRecs = currentItems.flatMap(item => 
      recommendationSystem.getRecommendations(item)
    );

    // Get contextual recommendations based on categories
    const contextRecs = currentCategories.flatMap(category => 
      smartRecommendations[category] || []
    );

    // Combine and filter out existing items and dismissed items
    const allRecs = [...new Set([...traditionalRecs, ...contextRecs])]
      .filter(rec => 
        !currentItems.includes(rec) && 
        !dismissedRecs.has(rec)
      )
      .slice(0, 8);

    setRecommendations(allRecs.slice(0, 4));
    setContextualRecs(allRecs.slice(4, 8));
  }, [items, dismissedRecs, recommendationSystem]);

  const handleAddRecommendation = (itemName: string) => {
    // Determine category based on smart recommendations
    let category = categories[0]; // default
    for (const [cat, items] of Object.entries(smartRecommendations)) {
      if (items.includes(itemName)) {
        category = cat;
        break;
      }
    }

    onAddItem({
      name: itemName,
      quantity: 1,
      category
    });

    // Update recommendation system
    const currentItems = items.map(item => item.name);
    recommendationSystem.addPurchaseData([...currentItems, itemName]);
  };

  const handleDismiss = (itemName: string) => {
    setDismissedRecs(prev => new Set([...prev, itemName]));
  };

  const hasRecommendations = recommendations.length > 0 || contextualRecs.length > 0;

  if (!hasRecommendations) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Main Recommendations - Mobile Optimized */}
      {recommendations.length > 0 && (
        <Card className="p-3">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              המלצות חכמות
            </CardTitle>
            <CardDescription className="text-sm">
              מוצרים שלרוב קונים יחד עם הפריטים ברשימה שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2">
              {recommendations.map((item) => (
                <div
                  key={item}
                  className="group flex items-center gap-1 px-3 py-2 bg-blue-50 rounded-full text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddRecommendation(item)}
                    className="h-auto p-0 text-blue-700 hover:text-blue-900 font-medium text-sm"
                  >
                    {item}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(item)}
                    className="h-auto p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  >
                    <X size={12} className="text-blue-500 hover:text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contextual Recommendations - Mobile Optimized */}
      {contextualRecs.length > 0 && (
        <Card className="p-3">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              עוד הצעות מעניינות
            </CardTitle>
            <CardDescription className="text-sm">
              מוצרים פופולריים מהקטגוריות שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2">
              {contextualRecs.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="cursor-pointer hover:bg-purple-100 transition-colors group text-sm px-3 py-1.5"
                  onClick={() => handleAddRecommendation(item)}
                >
                  <Plus size={12} className="ml-1" />
                  {item}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(item);
                    }}
                    className="h-auto p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} className="text-gray-500 hover:text-red-500" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
