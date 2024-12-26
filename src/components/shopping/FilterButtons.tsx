import React from "react";
import { cn } from "@/lib/utils";

interface FilterButtonsProps {
  filter: "all" | "active" | "completed";
  onFilterChange: (filter: "all" | "active" | "completed") => void;
}

export const FilterButtons = ({ filter, onFilterChange }: FilterButtonsProps) => {
  return (
    <div className="flex gap-2 mb-4 justify-end">
      <button
        onClick={() => onFilterChange("all")}
        className={cn(
          "px-4 py-2 rounded-lg",
          filter === "all"
            ? "bg-primary text-white"
            : "bg-secondary text-foreground"
        )}
      >
        הכל
      </button>
      <button
        onClick={() => onFilterChange("active")}
        className={cn(
          "px-4 py-2 rounded-lg",
          filter === "active"
            ? "bg-primary text-white"
            : "bg-secondary text-foreground"
        )}
      >
        פעיל
      </button>
      <button
        onClick={() => onFilterChange("completed")}
        className={cn(
          "px-4 py-2 rounded-lg",
          filter === "completed"
            ? "bg-primary text-white"
            : "bg-secondary text-foreground"
        )}
      >
        הושלם
      </button>
    </div>
  );
};