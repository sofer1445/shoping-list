import React, { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RecommendationsProps {
  recommendations: string[];
  onSelect: (item: string) => void;
  onDismiss: (item: string) => void;
  className?: string;
  disabled?: boolean;
}

export const Recommendations = ({
  recommendations,
  onSelect,
  onDismiss,
  className,
  disabled
}: RecommendationsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (recommendations.length === 0) return null;

  return (
    <div className={cn("space-y-2 animate-fadeIn", className)}>
      <Button variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-start gap-2 w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <span>המלצות חכמות ({recommendations.length})</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>
      
      {isExpanded && (
        <div className="flex flex-wrap gap-2 animate-fadeIn">
          {recommendations.map((item) => (
            <div
              key={item}
              className="group flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full text-sm animate-slideIn hover:bg-primary/20 transition-colors border border-primary/20"
            >
              <Button variant="ghost"
                disabled={disabled}
                onClick={() => onSelect(item)}
                className="text-primary hover:text-primary/80 font-medium h-11 px-1 whitespace-normal [overflow-wrap:anywhere]"
              >
                {item}
              </Button>
              <Button variant="ghost" size="icon"
                onClick={() => onDismiss(item)}
                className="h-11 w-11 shrink-0"
                aria-label={`הסר המלצה: ${item}`}
              >
                <X size={14} className="text-primary hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};