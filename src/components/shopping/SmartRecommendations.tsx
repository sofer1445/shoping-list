
import React, { useState, useEffect } from "react";
import { Lightbulb, X, Plus, Sparkles, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingItem } from "./types";
import { RecommendationSystem } from "@/utils/RecommendationSystem";
import { UserLearningSystem, SmartRecommendation } from "@/utils/userLearning";
import { useAuth } from "@/components/AuthProvider";

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
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [smartRecommendations, setSmartRecommendations] = useState<SmartRecommendation[]>([]);
  const [contextualRecs, setContextualRecs] = useState<string[]>([]);
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set());
  const [recommendationSystem] = useState(() => new RecommendationSystem());
  const [userLearningSystem, setUserLearningSystem] = useState<UserLearningSystem | null>(null);
  const [isMainExpanded, setIsMainExpanded] = useState(false);
  const [isContextualExpanded, setIsContextualExpanded] = useState(false);
  const [isSmartExpanded, setIsSmartExpanded] = useState(true);

  // Initialize user learning system
  useEffect(() => {
    if (user?.id) {
      setUserLearningSystem(new UserLearningSystem(user.id));
    }
  }, [user?.id]);

  // Enhanced Hebrew product recommendations by category
  const hebrewRecommendations = {
    'ירקות ופירות': [
      'עגבניות', 'מלפפונים', 'בצל', 'גזר', 'תפוחים', 'בננות', 
      'פלפל אדום', 'חסה', 'פטרוזיליה', 'לימון', 'תפוז', 'אבוקדו',
      'תפוחי אדמה', 'בטטה', 'קולרבי', 'כרוב', 'ברוקולי'
    ],
    'מזון': [
      'לחם', 'אורז', 'פסטה', 'שמן זית', 'מלח', 'פלפל שחור',
      'קמח', 'סוכר', 'שמרים', 'קטשופ', 'מיונז', 'חומץ',
      'רוטב עגבניות', 'טונה', 'קורנפלקס', 'דגנים', 'חומוס', 'טחינה'
    ],
    'מוצרי חלב': [
      'חלב', 'גבינה צהובה', 'יוגורט', 'חמאה', 'שמנת', 
      'גבינה לבנה', 'גבינת קוטג\'', 'לבנה', 'קרם פרש'
    ],
    'ניקיון': [
      'סבון כלים', 'נייר טואלט', 'משטח לרצפה', 'אקונומיקה',
      'מטליות', 'נייר מגבת', 'אבקת כביסה', 'מרכך כביסה',
      'סבון ידיים', 'שמפו', 'קרם גילוח'
    ],
    'אחר': [
      'משחת שיניים', 'מברשת שיניים', 'דאודורנט', 'קרם לחות',
      'ויטמינים', 'תרופות', 'נרות', 'שקיות זבל', 'נייר כסף'
    ]
  };

  // Load smart recommendations based on user learning
  useEffect(() => {
    const loadSmartRecommendations = async () => {
      if (userLearningSystem && items.length > 0) {
        try {
          const smartRecs = await userLearningSystem.generateRecommendations(items);
          setSmartRecommendations(smartRecs.filter(rec => !dismissedRecs.has(rec.item)));
        } catch (error) {
          console.error('Error loading smart recommendations:', error);
        }
      }
    };

    loadSmartRecommendations();
  }, [userLearningSystem, items, dismissedRecs]);

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
      hebrewRecommendations[category] || []
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
  }, [items, dismissedRecs, recommendationSystem, hebrewRecommendations]);

  const handleAddRecommendation = (itemName: string, category?: string) => {
    // Determine category based on Hebrew recommendations or provided category
    let finalCategory = category || categories[0]; // default
    if (!category) {
      for (const [cat, items] of Object.entries(hebrewRecommendations)) {
        if (items.includes(itemName)) {
          finalCategory = cat;
          break;
        }
      }
    }

    onAddItem({
      name: itemName,
      quantity: 1,
      category: finalCategory
    });

    // Update recommendation system and user learning
    const currentItems = items.map(item => item.name);
    recommendationSystem.addPurchaseData([...currentItems, itemName]);
    
    // Update user learning system if available
    if (userLearningSystem) {
      userLearningSystem.updateUserBehavior('item_added', {
        name: itemName,
        category: finalCategory,
      });
    }
  };

  const handleAddSmartRecommendation = (recommendation: SmartRecommendation) => {
    handleAddRecommendation(recommendation.item, recommendation.category);
  };

  const handleDismiss = (itemName: string) => {
    setDismissedRecs(prev => new Set([...prev, itemName]));
  };

  const hasRecommendations = recommendations.length > 0 || contextualRecs.length > 0 || smartRecommendations.length > 0;

  if (!hasRecommendations) {
    return null;
  }

  return (
    <div className="space-y-3" dir="rtl">
      {/* Smart AI-Powered Recommendations */}
      {smartRecommendations.length > 0 && (
        <Card className="p-3 border-blue-200 bg-blue-50/50">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSmartExpanded(!isSmartExpanded)}
                className="h-8 w-8 p-0"
              >
                {isSmartExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <div className="text-right">
                <CardTitle className="text-base flex items-center gap-2 justify-end">
                  <span>המלצות אישיות מבוססות AI</span>
                  <Brain className="h-4 w-4 text-blue-500" />
                </CardTitle>
                <CardDescription className="text-sm text-right">
                  המלצות מותאמות אישית בהתבסס על הרגלי הקנייה שלך
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {isSmartExpanded && (
            <CardContent className="p-0">
              <div className="space-y-2">
                {smartRecommendations.map((rec) => (
                  <div
                    key={rec.item}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDismiss(rec.item)}
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddSmartRecommendation(rec)}
                        className="h-7 px-2"
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        הוסף
                      </Button>
                    </div>
                    <div className="text-right flex-1">
                      <div className="flex items-center gap-2 justify-end">
                        <Badge variant="outline" className="text-xs">
                          {rec.category}
                        </Badge>
                        <span className="font-medium">{rec.item}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rec.explanation}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs text-blue-600">
                          {Math.round(rec.confidence * 100)}% ביטחון
                        </span>
                        <div className="w-12 h-1 bg-gray-200 rounded">
                          <div 
                            className="h-1 bg-blue-500 rounded" 
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Main Recommendations - Hebrew optimized */}
      {recommendations.length > 0 && (
        <Card className="p-3">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMainExpanded(!isMainExpanded)}
                className="h-8 w-8 p-0"
              >
                {isMainExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <div className="text-right">
                <CardTitle className="text-base flex items-center gap-2 justify-end">
                  <span>המלצות חכמות</span>
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                </CardTitle>
                <CardDescription className="text-sm text-right">
                  מוצרים שלרוב קונים יחד עם הפריטים ברשימה שלך
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {isMainExpanded && (
            <CardContent className="p-0">
              <div className="flex flex-wrap gap-2 justify-end">
                {recommendations.map((item) => (
                  <div
                    key={item}
                    className="group flex items-center gap-1 px-3 py-2 bg-blue-50 rounded-full text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(item)}
                      className="h-auto p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} className="text-blue-500 hover:text-red-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddRecommendation(item)}
                      className="h-auto p-0 text-blue-700 hover:text-blue-900 font-medium text-sm"
                    >
                      {item}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Contextual Recommendations - Hebrew optimized */}
      {contextualRecs.length > 0 && (
        <Card className="p-3">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsContextualExpanded(!isContextualExpanded)}
                className="h-8 w-8 p-0"
              >
                {isContextualExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <div className="text-right">
                <CardTitle className="text-base flex items-center gap-2 justify-end">
                  <span>עוד הצעות מעניינות</span>
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </CardTitle>
                <CardDescription className="text-sm text-right">
                  מוצרים פופולריים מהקטגוריות שלך
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {isContextualExpanded && (
            <CardContent className="p-0">
              <div className="flex flex-wrap gap-2 justify-end">
                {contextualRecs.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-100 transition-colors group text-sm px-3 py-1.5 font-medium"
                    onClick={() => handleAddRecommendation(item)}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(item);
                      }}
                      className="h-auto p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} className="text-gray-500 hover:text-red-500" />
                    </Button>
                    <span>{item}</span>
                    <Plus size={12} className="mr-1" />
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};
