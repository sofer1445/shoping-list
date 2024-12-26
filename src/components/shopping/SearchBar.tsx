import React from "react";
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
  items = [], // Default to empty array if items is undefined
  onSearch,
  onSelectSuggestion,
}: SearchBarProps) => {
  // Always ensure items is an array before filtering
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
        className="text-right"
      />
      <CommandList>
        {suggestions.length > 0 ? (
          <CommandGroup>
            {suggestions.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => onSelectSuggestion(item.name)}
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
    </Command>
  );
};