import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Hand, PartyPopper, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "./types";
import { ProductImage } from "./ProductImage";

interface Props {
  items: ShoppingItem[];
  total: number;
  done: number;
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  profiles: Record<string, string>;
  onFinish?: () => void;
  finishDisabled?: boolean;
}

const HINT_KEY = "focus-mode-hint-seen";

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
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [marking, setMarking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    let seen = true;
    try {
      seen = !!localStorage.getItem(HINT_KEY);
    } catch {
      seen = false;
    }
    if (!seen) {
      setShowHint(true);
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* storage unavailable — hint may show again */
      }
      const t = setTimeout(() => setShowHint(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (index > queue.length - 1) setIndex(Math.max(0, queue.length - 1));
  }, [queue.length, index]);

  const item = queue[index];

  const go = (dir: 1 | -1) => {
    if (queue.length === 0) return;
    setIndex((i) => (i + dir + queue.length) % queue.length);
    setDx(0);
  };

  const markDone = () => {
    if (!item || marking) return;
    setMarking(true);
    onToggle(item.id);
    setTimeout(() => {
      setMarking(false);
      setDx(0);
      setIndex((i) => (i >= queue.length - 1 ? 0 : i));
    }, 320);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    const moved = dx;
    startX.current = null;
    if (Math.abs(moved) > 70) {
      // RTL: swipe right → next item, swipe left → previous
      go(moved > 0 ? 1 : -1);
    } else {
      setDx(0);
    }
  };

  if (queue.length === 0 || !item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4" dir="rtl">
        <PartyPopper className="h-14 w-14 text-success" />
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
            className="mt-2 h-14 px-8 rounded-2xl text-[16px] font-semibold"
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
        onPointerCancel={onPointerUp}
        onDoubleClick={() => onEdit(item)}
        style={{
          transform: `translateX(${dx}px) rotate(${dx / 60}deg)`,
          transition: startX.current === null ? "transform 220ms ease" : "none",
        }}
        className={cn(
          "relative flex-1 min-h-0 flex flex-col items-center justify-center gap-6 px-6 text-center touch-pan-y overflow-hidden [overscroll-behavior-x:contain]",
          marking && "opacity-70"
        )}
      >
        <div className="h-[42vw] w-[42vw] max-h-52 max-w-52 rounded-[36px] bg-primary/[0.06] border border-primary/10 flex items-center justify-center">
          <div className="scale-[4]">
            <ProductImage productName={item.name} category={item.category} />
          </div>
        </div>

        <h2 className="font-display font-bold text-[clamp(26px,8vw,40px)] leading-[1.1] break-words [overflow-wrap:anywhere] max-w-[92%] line-clamp-3">
          {item.name}
        </h2>

        <div className="text-[13px] text-muted-foreground space-y-1">
          {item.quantity > 1 && <div className="font-semibold text-foreground">כמות: {item.quantity}</div>}
          {addedBy && <div className="text-[11px] opacity-80">נוסף ע״י {addedBy}</div>}
        </div>

        {marking && (
          <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in-95">
            <Check className="h-24 w-24 text-success" />
          </div>
        )}
      </div>

      {/* Thumb zone */}
      <div className="px-5 pb-2 space-y-2">
        <Button
          onClick={markDone}
          size="lg"
          className="w-full h-16 rounded-[22px] text-[18px] font-semibold shadow-lg"
        >
          <Check className="h-6 w-6" />
          סמן כנקנה
        </Button>

        <div className="flex items-center">
          <Button
            variant="ghost"
            className="flex-1 h-11 rounded-2xl text-muted-foreground text-[13px]"
            onClick={() => go(-1)}
            aria-label="הפריט הקודם"
          >
            <ChevronRight className="h-4 w-4" />
            הקודם
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-11 rounded-2xl text-muted-foreground text-[13px]"
            onClick={() => go(1)}
            aria-label="דלג לפריט הבא"
          >
            דלג
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showHint && (
        <div className="absolute inset-x-0 bottom-36 z-40 flex justify-center px-6 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-foreground/90 text-background text-[12px] px-4 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <Hand className="h-4 w-4" />
            החלק ימינה ושמאלה כדי לעבור בין הפריטים
          </div>
        </div>
      )}
    </div>
  );
};
