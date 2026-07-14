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
}

const emoji: Record<string, string> = {
  "מזון": "🍞",
  "ירקות ופירות": "🥦",
  "מוצרי חלב": "🥛",
  "ניקיון": "🧴",
  "אחר": "📦",
};

export const CategoryGroup = ({ category, items, onToggle, onEdit }: Props) => {
  const [open, setOpen] = useState(true);
  const remaining = items.filter((i) => !i.completed).length;

  return (
    <section className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2 py-1.5"
        dir="rtl"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            !open && "-rotate-90"
          )}
        />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {remaining}/{items.length}
          </span>
          <h3 className="font-display font-semibold text-sm">{category}</h3>
          <span className="text-base">{emoji[category] || "🛒"}</span>
        </div>
      </button>
      {open && (
        <div className="space-y-2">
          {items.map((item) => (
            <ShoppingRow key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} />
          ))}
        </div>
      )}
    </section>
  );
};
