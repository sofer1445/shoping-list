import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "./types";
import { ShoppingRow } from "./ShoppingRow";

interface Props {
  category: string;
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  profiles?: Record<string, string>;
}

const emoji: Record<string, string> = {
  "מזון": "🍞",
  "ירקות ופירות": "🥦",
  "מוצרי חלב": "🥛",
  "ניקיון": "🧴",
  "אחר": "📦",
};

export const CategoryGroup = ({ category, items, onToggle, onEdit, profiles }: Props) => {
  const [open, setOpen] = useState(true);
  const remaining = items.filter((i) => !i.completed).length;

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1.5 py-2 group hover:bg-muted/30 rounded-lg transition-colors"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl filter drop-shadow-sm">{emoji[category] || "🛒"}</span>
          <h3 className="font-display font-bold text-[16px] tracking-tight">{category}</h3>
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full border transition-colors",
              remaining === 0
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted/50 text-muted-foreground border-transparent"
            )}
          >
            {remaining === 0 ? "הושלם" : `${remaining} נותרו`}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground/60 transition-transform duration-300",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {items.map((item) => (
            <ShoppingRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              attribution={{
                addedBy: item.created_by ? profiles?.[item.created_by] : null,
                completedBy: item.completed_by ? profiles?.[item.completed_by] : null,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};
