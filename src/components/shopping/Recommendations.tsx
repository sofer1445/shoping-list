import React, { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (recommendations.length === 0) return null;

  return (
    <div className={cn("space-y-2 animate-fadeIn", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <span>המלצות חכמות ({recommendations.length})</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isExpanded && (
        <div className="flex flex-wrap gap-2 animate-fadeIn">
          {recommendations.map((item) => (
            <div
              key={item}
              className="group flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full text-sm animate-slideIn hover:bg-primary/20 transition-colors border border-primary/20"
            >
              <button
                onClick={() => onSelect(item)}
                className="text-primary hover:text-primary/80 font-medium"
              >
                {item}
              </button>
              <button
                onClick={() => onDismiss(item)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-primary hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};