import { useState } from "react";
import { ChevronDown, Apple, Milk, Package, SprayCan, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const categoryIcons: Record<string, typeof Package> = {
  "מזון": Wheat,
  "ירקות ופירות": Apple,
  "מוצרי חלב": Milk,
  "ניקיון": SprayCan,
  "אחר": Package,
};

export const CategoryGroup = ({ category, items, onToggle, onEdit, profiles }: Props) => {
  const [open, setOpen] = useState(true);
  const remaining = items.filter((i) => !i.completed).length;
  const Icon = categoryIcons[category] || Package;

  return (
    <section className="space-y-3">
      <Button
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full h-auto min-h-11 flex items-center justify-between px-0 py-2 group rounded-lg transition-colors whitespace-normal gap-2"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-base">{category}</h3>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full transition-colors shrink-0",
              remaining === 0
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {remaining === 0 ? "הושלם" : `${remaining} נותרו`}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300",
            !open && "-rotate-90"
          )}
        />
      </Button>
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
