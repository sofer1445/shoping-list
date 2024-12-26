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
  items = [], // Provide default empty array
  onSearch,
  onSelectSuggestion,
}: SearchBarProps) => {
  // Ensure items is always an array before filtering
  const suggestions = Array.isArray(items) 
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      {searchQuery && (
        <CommandList>
          <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
          {suggestions.length > 0 && (
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
          )}
        </CommandList>
      )}
    </Command>
  );
};