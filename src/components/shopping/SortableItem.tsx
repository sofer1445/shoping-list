import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Edit, Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "./types";
import { ProductImage } from "./ProductImage";

interface SortableItemProps {
  item: ShoppingItem;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

export const SortableItem = ({
  item,
  onDelete,
  onToggle,
  onEdit,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border animate-fadeIn transition-colors",
        item.completed ? "bg-secondary" : "bg-white",
        item.isNew && "bg-green-100",
        item.justCompleted && "bg-red-100"
      )}
    >
      <div className="flex gap-2">
        <button
          className="text-destructive hover:text-destructive/80 transition-colors"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 size={20} />
        </button>
        <button
          className="text-primary hover:text-primary/80 transition-colors"
          onClick={() => onEdit(item.id)}
        >
          <Edit size={20} />
        </button>
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={20} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-right">
        <button
          onClick={() => onToggle(item.id)}
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            item.completed
              ? "border-primary bg-primary text-white"
              : "border-gray-300"
          )}
        >
          {item.completed && <Check size={16} />}
        </button>
        <div className="flex items-center gap-3">
          <ProductImage productName={item.name} category={item.category} />
          <div>
            <div className={cn(item.completed && "line-through")}>
              {item.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {item.category} • {item.quantity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};