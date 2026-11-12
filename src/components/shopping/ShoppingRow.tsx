import { Check, Pencil, UserPlus2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "./types";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface Props {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  attribution?: { addedBy?: string | null; completedBy?: string | null };
}

export const ShoppingRow = ({ item, onToggle, onEdit, attribution }: Props) => {
  const { user } = useAuth();
  const addedByOther =
    item.created_by && user && item.created_by !== user.id ? attribution?.addedBy : null;
  const completedByOther =
    item.completed && item.completed_by && user && item.completed_by !== user.id
      ? attribution?.completedBy
      : null;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-4 min-h-[80px] transition-colors",
        item.completed && "bg-surface-muted",
        item.justCompleted && "bg-success/10 border-success/40 animate-in fade-in zoom-in-95 duration-300",
        item.isNew && "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
      )}
      dir="rtl"
    >
      <Button
        variant="ghost"
        onClick={() => onToggle(item.id)}
        aria-label={`${item.completed ? "בטל סימון" : "סמן כנקנה"}: ${item.name}`}
        aria-pressed={item.completed}
        className="absolute inset-0 w-full h-full hover:bg-transparent focus-visible:ring-inset rounded-lg"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item);
        }}
        className="relative z-10 order-last h-11 w-11 rounded-lg text-muted-foreground shrink-0"
        aria-label={`ערוך את ${item.name}`}
      >
        <Pencil className="h-5 w-5" />
      </Button>

      <div className="flex-1 min-w-0 text-right">
        <div
          className={cn(
            "font-semibold text-base break-words leading-snug",
            item.completed && "line-through text-muted-foreground"
          )}
        >
          {item.name}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
          {item.quantity > 1 && <span className="font-semibold bg-muted px-1.5 py-0.5 rounded">×{item.quantity}</span>}
          {completedByOther ? (
            <span className="flex items-center gap-1 text-success font-medium">
              <Check className="h-3 w-3" />
              סומן ע״י {completedByOther}
            </span>
          ) : addedByOther ? (
            <span className="flex items-center gap-1">
              <UserPlus2 className="h-3 w-3" />
              נוסף ע״י {addedByOther}
            </span>
          ) : item.isNew ? (
            <span className="text-primary font-bold">חדש</span>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "order-first h-9 w-9 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0",
          item.completed
            ? "bg-success border-success text-success-foreground"
            : "border-muted-foreground/30 group-hover:border-primary group-active:scale-90"
        )}
      >
        {item.completed && <Check className="h-6 w-6" strokeWidth={3} />}
      </div>
    </div>
  );
};
