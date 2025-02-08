import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { ShoppingItem } from "./types";

interface SearchBarProps {
  searchQuery: string;
  items: ShoppingItem[];
  onSearch: (value: string) => void;
  onSelectSuggestion: (itemName: string) => void;
}

export const SearchBar = ({
  searchQuery,
  items = [], 
  onSearch,
  onSelectSuggestion,
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const suggestions = Array.isArray(items) 
    ? items.filter((item) =>
        item.name.toLowerCase().includes((searchQuery || '').toLowerCase())
      )
    : [];

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="חיפוש מוצרים..."
        value={searchQuery}
        onValueChange={onSearch}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        className="text-right"
      />
      {isFocused && (
        <CommandList>
          {suggestions.length > 0 ? (
            <CommandGroup>
              {suggestions.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    onSelectSuggestion(item.name);
                    setIsFocused(false);
                  }}
                  className="text-right"
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            searchQuery && <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
          )}
        </CommandList>
      )}
    </Command>
  );
};