import { useMemo, useRef, useState } from "react";
import { Check, ChevronRight, PartyPopper, SkipForward, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "./types";
import { ProductImage } from "./ProductImage";

interface Props {
  items: ShoppingItem[];
  total: number;
  done: number;
  onToggle: (id: string) => boolean | Promise<boolean>;
  onEdit: (item: ShoppingItem) => void;
  profiles: Record<string, string>;
  onFinish?: () => void;
  finishDisabled?: boolean;
}

export const FocusMode = ({
  items,
  total,
  done,
  onToggle,
  onEdit,
  profiles,
  onFinish,
  finishDisabled,
}: Props) => {
  // Only unpurchased items, stable order
  const queue = useMemo(() => items.filter((i) => !i.completed), [items]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dx, setDx] = useState(0);
  const [marking, setMarking] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const displacement = useRef(0);

  const item = queue.find((value) => value.id === activeId) ?? queue[0];
  const index = item ? queue.findIndex((value) => value.id === item.id) : 0;

  const resetGesture = () => {
    start.current = null;
    displacement.current = 0;
    setDx(0);
  };
  const go = (dir: 1 | -1) => {
    if (!queue.length || marking) return;
    setActiveId(queue[(index + dir + queue.length) % queue.length].id);
    resetGesture();
  };

  const markDone = async () => {
    if (!item || marking) return;
    setMarking(true);
    const next = queue[index + 1] ?? queue[0];
    try {
      const saved = await onToggle(item.id);
      if (saved && next) setActiveId(next.id);
    } finally {
      setMarking(false);
      resetGesture();
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || marking) return;
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!start.current) return;
    const moved = event.clientX - start.current.x;
    if (Math.abs(event.clientY - start.current.y) > Math.abs(moved) + 12) {
      resetGesture();
      return;
    }
    displacement.current = moved;
    setDx(Math.max(-120, Math.min(120, moved)));
  };
  const onPointerUp = () => {
    if (!start.current) return;
    const moved = displacement.current;
    resetGesture();
    // RTL: right is next, left is previous. Cancellation never navigates.
    if (Math.abs(moved) > 70) go(moved > 0 ? 1 : -1);
  };

  if (queue.length === 0 || !item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 overflow-y-auto" dir="rtl">
        <PartyPopper className="h-16 w-16 text-success" />
        <div className="font-display font-semibold text-xl">
          {total > 0 ? "סיימת הכל" : "הרשימה ריקה"}
        </div>
        <p className="text-sm text-muted-foreground">
          {total > 0 ? "אפשר לסיים את הקנייה ולשמור בהיסטוריה" : "הוסף פריטים בתצוגת הרשימה"}
        </p>
        {total > 0 && onFinish && (
          <Button
            onClick={onFinish}
            disabled={finishDisabled}
            size="lg"
            className="mt-2 h-14 px-6 rounded-lg text-base font-semibold max-w-full whitespace-normal"
          >
            <Check className="h-5 w-5" />
            סיים ושמור בהיסטוריה
          </Button>
        )}
      </div>
    );
  }

  const addedBy = item.created_by ? profiles[item.created_by] : null;

  return (
    <div className="flex-1 flex flex-col select-none min-h-0 overflow-hidden" dir="rtl">
      {/* The product IS the screen */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={resetGesture}
        onDoubleClick={() => onEdit(item)}
        style={{
          transform: `translateX(${dx}px) rotate(${dx / 60}deg)`,
          transition: start.current === null ? "transform 220ms ease" : "none",
        }}
        className={cn(
          "relative focus-product touch-pan-y [overscroll-behavior-x:contain]",
          marking && "opacity-70"
        )}
      >
        <Button variant="ghost" size="icon" className="absolute top-2 left-2 h-11 w-11" aria-label="עריכת הפריט"
          onPointerDown={(event) => event.stopPropagation()} onClick={() => onEdit(item)} disabled={marking}>
          <Pencil className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground shrink-0">{item.category || "אחר"}</span>
        <div className="focus-visual">
          <div className="scale-[4]">
            <ProductImage productName={item.name} category={item.category} />
          </div>
        </div>

        <h2 className="focus-title font-display font-bold shrink-0">
          {item.name}
        </h2>

        <div className="text-sm text-muted-foreground space-y-1 shrink-0">
          {item.quantity > 1 && <div className="font-semibold text-foreground">כמות: {item.quantity}</div>}
          {addedBy && <div className="text-xs">נוסף ע״י {addedBy}</div>}
        </div>

        {marking && (
          <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in-95">
            <Check className="h-24 w-24 text-success" />
          </div>
        )}
      </div>

      {/* Thumb zone */}
      <div className="focus-actions space-y-2">
        <Button
          onClick={markDone}
          disabled={marking}
          size="lg"
          className="w-full h-16 rounded-lg text-lg font-semibold bg-success text-success-foreground hover:bg-success/90"
        >
          <Check className="h-6 w-6" />
          {marking ? "שומר..." : "סמן כנקנה"}
        </Button>

        <div className="flex items-center">
          <Button
            variant="ghost"
            className="flex-1 h-11 rounded-2xl text-muted-foreground text-[13px]"
            onClick={() => go(-1)}
            disabled={marking || queue.length < 2}
            aria-label="הפריט הקודם"
          >
            <ChevronRight className="h-4 w-4" />
            הקודם
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-11 rounded-2xl text-muted-foreground text-[13px]"
            onClick={() => go(1)}
            disabled={marking || queue.length < 2}
            aria-label="דלג לפריט הבא"
          >
            דלג
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

    </div>
  );
};
