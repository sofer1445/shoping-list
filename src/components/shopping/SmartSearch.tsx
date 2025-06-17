
import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, TrendingUp } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingItem } from "./types";
import { cn } from "@/lib/utils";

interface SmartSearchProps {
  searchQuery: string;
  items: ShoppingItem[];
  onSearch: (value: string) => void;
  onFilterByCategory: (category: string | null) => void;
  selectedCategory?: string | null;
}

const popularHebrewItems = [
  "לחם", "חלב", "ביצים", "עגבניות", "מלפפונים", "בצל", "תפוחי אדמה",
  "גבינה צהובה", "יוגורט", "עוף", "אורז", "פסטה", "שמן זית", "סוכר",
  "תפוחים", "בננות", "גזר", "פלפל", "חסה", "קציצות", "נקניקיות",
  "דגנים", "שמרים", "קמח", "חומץ", "רוטב עגבניות", "טונה", "גבינה לבנה"
];

export const SmartSearch = ({
  searchQuery,
  items,
  onSearch,
  onFilterByCategory,
  selectedCategory
}: SmartSearchProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Get categories from existing items
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(item => item.category))];
    return cats.sort();
  }, [items]);

  // Smart suggestions based on search query for Hebrew
  useEffect(() => {
    if (searchQuery.length > 0) {
      const existing = items.map(item => item.name.toLowerCase());
      const filtered = popularHebrewItems.filter(item => 
        item.includes(searchQuery) &&
        !existing.includes(item.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, items]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches_hebrew');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (value: string) => {
    onSearch(value);
    if (value && !recentSearches.includes(value)) {
      const updated = [value, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recent_searches_hebrew', JSON.stringify(updated));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="relative">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="חיפוש חכם של מוצרים..."
            className="pr-10 text-right h-12 text-base font-medium"
            style={{ direction: 'rtl' }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
        </div>

        {/* Smart Suggestions */}
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {suggestions.length > 0 && (
              <div className="p-3">
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1 justify-end">
                  <span>הצעות פופולריות</span>
                  <TrendingUp className="h-3 w-3" />
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-right p-3 hover:bg-gray-50 rounded text-sm border-b border-gray-100 last:border-b-0 font-medium"
                    style={{ direction: 'rtl' }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {recentSearches.length > 0 && suggestions.length > 0 && (
              <div className="border-t border-gray-100"></div>
            )}
            
            {recentSearches.length > 0 && (
              <div className="p-3">
                <div className="text-xs text-gray-500 mb-2 text-right">חיפושים אחרונים</div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-right p-3 hover:bg-gray-50 rounded text-sm text-gray-600 border-b border-gray-100 last:border-b-0"
                    style={{ direction: 'rtl' }}
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filters - Hebrew optimized */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2 justify-end">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterByCategory(null)}
            className="h-9 px-4 font-medium"
          >
            הכל
            <Filter className="h-3 w-3 mr-1" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors px-3 py-1.5 text-sm font-medium",
                selectedCategory === category 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-primary/10"
              )}
              onClick={() => onFilterByCategory(
                selectedCategory === category ? null : category
              )}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
