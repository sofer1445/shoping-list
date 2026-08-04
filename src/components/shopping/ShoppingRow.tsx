import { Check, Pencil, UserPlus2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "./types";
import { useAuth } from "@/components/AuthProvider";

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
      onClick={() => onToggle(item.id)}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 min-h-[72px] cursor-pointer transition-all shadow-sm hover:shadow-md",
        "active:scale-[0.98]",
        item.completed && "opacity-70",
        item.justCompleted && "bg-success/10 border-success/40 animate-in fade-in zoom-in-95 duration-300",
        item.isNew && "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
      )}
      dir="rtl"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item);
        }}
        className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0 transition-colors"
        aria-label="ערוך"
      >
        <Pencil className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0 text-right">
        <div
          className={cn(
            "font-medium text-[16px] truncate leading-tight",
            item.completed && "line-through text-muted-foreground"
          )}
        >
          {item.name}
        </div>
        <div className="flex items-center gap-2 justify-end mt-1 text-[12px] text-muted-foreground">
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
          "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
          item.completed
            ? "bg-success border-success text-white scale-100 shadow-sm"
            : "border-muted-foreground/30 group-hover:border-primary group-active:scale-90"
        )}
      >
        {item.completed && <Check className="h-6 w-6" strokeWidth={3} />}
      </div>
    </div>
  );
};
