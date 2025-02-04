import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationsProps {
  recommendations: string[];
  onSelect: (item: string) => void;
  onDismiss: (item: string) => void;
  className?: string;
}

export const Recommendations = ({
  recommendations,
  onSelect,
  onDismiss,
  className
}: RecommendationsProps) => {
  if (recommendations.length === 0) return null;

  return (
    <div className={cn("space-y-2 animate-fade-in", className)}>
      <div className="text-sm text-muted-foreground">נקנה ביחד לעיתים קרובות:</div>
      <div className="flex flex-wrap gap-2">
        {recommendations.map((item) => (
          <div
            key={item}
            className="group flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-sm animate-scale-in hover:bg-secondary/80 transition-colors"
          >
            <button
              onClick={() => onSelect(item)}
              className="text-primary-foreground"
            >
              {item}
            </button>
            <button
              onClick={() => onDismiss(item)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} className="text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};