
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

const popularItems = [
  "לחם", "חלב", "ביצים", "עגבניות", "מלפפונים", "בצל", "תפוחי אדמה",
  "גבינה צהובה", "יוגורט", "עוף", "אורז", "פסטה", "שמן זית", "סוכר"
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

  // Smart suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const existing = items.map(item => item.name.toLowerCase());
      const filtered = popularItems.filter(item => 
        item.toLowerCase().includes(searchQuery.toLowerCase()) &&
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
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (value: string) => {
    onSearch(value);
    if (value && !recentSearches.includes(value)) {
      const updated = [value, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="חיפוש חכם של מוצרים..."
            className="pr-10 text-right"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
        </div>

        {/* Smart Suggestions */}
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  הצעות פופולריות
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-right p-2 hover:bg-gray-50 rounded text-sm"
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
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2">חיפושים אחרונים</div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-right p-2 hover:bg-gray-50 rounded text-sm text-gray-600"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterByCategory(null)}
          className="h-8"
        >
          <Filter className="h-3 w-3 ml-1" />
          הכל
        </Button>
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "secondary"}
            className={cn(
              "cursor-pointer transition-colors",
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
  );
};
