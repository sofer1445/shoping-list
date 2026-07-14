import { Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "./types";

interface Props {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
}

export const ShoppingRow = ({ item, onToggle, onEdit }: Props) => {
  return (
    <div
      onClick={() => onToggle(item.id)}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 min-h-[64px] cursor-pointer transition-all",
        "active:scale-[0.99]",
        item.completed && "opacity-60",
        item.justCompleted && "bg-success/10 border-success/30",
        item.isNew && "bg-primary/5 border-primary/30"
      )}
      dir="rtl"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item);
        }}
        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0"
        aria-label="ערוך"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0 text-right">
        <div
          className={cn(
            "font-medium text-[15px] truncate",
            item.completed && "line-through"
          )}
        >
          {item.name}
        </div>
        {item.quantity > 1 && (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            כמות: {item.quantity}
          </div>
        )}
      </div>

      <div
        className={cn(
          "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
          item.completed
            ? "bg-success border-success text-white"
            : "border-muted-foreground/30 group-hover:border-primary"
        )}
      >
        {item.completed && <Check className="h-5 w-5" strokeWidth={3} />}
      </div>
    </div>
  );
};
