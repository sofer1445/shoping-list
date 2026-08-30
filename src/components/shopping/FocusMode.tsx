import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Hand,
  Pencil,
  PartyPopper,
  SkipForward,
} from "lucide-react";
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
}

const HINT_KEY = "focus-mode-hint-seen";

export const FocusMode = ({ items, total, done, onToggle, onEdit, profiles }: Props) => {
  // Only unpurchased items, stable order
  const queue = useMemo(() => items.filter((i) => !i.completed), [items]);
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [marking, setMarking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(HINT_KEY)) {
      setShowHint(true);
      localStorage.setItem(HINT_KEY, "1");
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
      <div className="px-4 pt-10" dir="rtl">
        <div className="surface-card p-8 text-center space-y-3">
          <PartyPopper className="h-12 w-12 mx-auto text-success" />
          <div className="font-display font-semibold text-lg">
            {total > 0 ? "אין פריטים שנותרו לקנייה" : "הרשימה ריקה"}
          </div>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? "אפשר לסיים את הקנייה ולשמור בהיסטוריה" : "הוסף פריטים כדי להתחיל"}
          </p>
        </div>
      </div>
    );
  }

  const addedBy = item.created_by ? profiles[item.created_by] : null;

  return (
    <div className="px-1 pt-2 pb-2 select-none" dir="rtl">
      {/* Progress — light and secondary */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] text-muted-foreground">
          {index + 1}/{queue.length} שנותרו
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {done}/{total} הושלמו
        </span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden mb-5 mx-1">
        <div
          className="h-full bg-primary/70 transition-all duration-500"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>

      {/* Dominant card */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${dx}px) rotate(${dx / 40}deg)`,
          transition: startX.current === null ? "transform 220ms ease" : "none",
        }}
        className={cn(
          "relative rounded-[28px] border border-border/50 bg-card shadow-[0_18px_45px_-20px_hsl(var(--foreground)/0.35)] px-6 py-9 text-center touch-pan-y",
          marking && "border-success/50 bg-success/5 scale-[0.98]"
        )}
      >
        <button
          onClick={() => onEdit(item)}
          className="absolute top-3 left-3 h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground/70 hover:bg-muted"
          aria-label="ערוך פריט"
        >
          <Pencil className="h-4 w-4" />
        </button>

        <div className="mx-auto h-36 w-36 rounded-[32px] bg-primary/[0.07] border border-primary/10 flex items-center justify-center mb-6">
          <div className="scale-[3.4]">
            <ProductImage productName={item.name} category={item.category} />
          </div>
        </div>

        <h2 className="font-display font-bold text-[32px] leading-[1.15] break-words">{item.name}</h2>

        <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
          <span className="px-2.5 py-1 rounded-full bg-secondary/70 text-secondary-foreground/80">
            {item.category || "אחר"}
          </span>
          <span>כמות: {item.quantity > 1 ? item.quantity : 1}</span>
        </div>

        {addedBy && (
          <div className="mt-2 text-[11px] text-muted-foreground/80">נוסף ע״י {addedBy}</div>
        )}

        {marking && (
          <div className="absolute inset-0 rounded-[28px] bg-success/10 flex items-center justify-center animate-in fade-in zoom-in-95">
            <Check className="h-16 w-16 text-success" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-7 space-y-3 px-1">
        <Button
          onClick={markDone}
          size="lg"
          className="w-full h-16 rounded-2xl text-[17px] font-semibold shadow-md"
        >
          <Check className="h-6 w-6" />
          סמן כנקנה
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="flex-1 h-11 rounded-2xl text-muted-foreground"
            onClick={() => go(-1)}
            aria-label="הפריט הקודם"
          >
            <ChevronRight className="h-5 w-5" />
            הקודם
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-11 rounded-2xl text-muted-foreground"
            onClick={() => go(1)}
            aria-label="דלג לפריט הבא"
          >
            דלג
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {showHint && (
        <div className="fixed inset-x-0 bottom-32 z-40 flex justify-center px-6 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-foreground/90 text-background text-[12px] px-4 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <Hand className="h-4 w-4" />
            החלק ימינה ושמאלה כדי לעבור בין הפריטים
          </div>
        </div>
      )}
    </div>
  );
};
