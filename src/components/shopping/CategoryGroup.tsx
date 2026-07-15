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
  const pct = items.length > 0 ? Math.round(((items.length - remaining) / items.length) * 100) : 0;

  return (
    <section className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 py-1.5 group"
        dir="rtl"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            !open && "-rotate-90"
          )}
        />
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full",
              remaining === 0
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {remaining === 0 ? "הושלם" : `${remaining}/${items.length}`}
          </span>
          <h3 className="font-display font-semibold text-[15px]">{category}</h3>
          <span className="text-lg">{emoji[category] || "🛒"}</span>
        </div>
      </button>
      {open && (
        <div className="space-y-2">
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
