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
    <div className="px-4 pt-5 pb-4 select-none" dir="rtl">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-muted-foreground">
          פריט {index + 1} מתוך {queue.length} שנותרו
        </span>
        <span className="text-[13px] font-semibold tabular-nums">
          {done}/{total} הושלמו
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-5">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>

      {/* Card */}
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
          "relative rounded-3xl border border-border/60 bg-card shadow-lg p-6 text-center touch-pan-y",
          marking && "border-success/50 bg-success/5 scale-[0.98]"
        )}
      >
        <button
          onClick={() => onEdit(item)}
          className="absolute top-3 left-3 h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
          aria-label="ערוך פריט"
        >
          <Pencil className="h-4 w-4" />
        </button>

        <div className="mx-auto h-28 w-28 rounded-3xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-4">
          <div className="scale-[2.6]">
            <ProductImage productName={item.name} category={item.category} />
          </div>
        </div>

        <span className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground mb-2">
          {item.category || "אחר"}
        </span>

        <h2 className="font-display font-bold text-[26px] leading-tight break-words">{item.name}</h2>

        <div className="mt-2 text-sm text-muted-foreground">
          {item.quantity > 1 ? `כמות: ${item.quantity}` : "כמות: 1"}
        </div>

        {addedBy && (
          <div className="mt-1 text-[12px] text-muted-foreground">נוסף ע״י {addedBy}</div>
        )}

        {marking && (
          <div className="absolute inset-0 rounded-3xl bg-success/10 flex items-center justify-center animate-in fade-in zoom-in-95">
            <Check className="h-16 w-16 text-success" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 space-y-3">
        <Button
          onClick={markDone}
          size="lg"
          className="w-full h-16 rounded-2xl text-[17px] font-semibold"
        >
          <Check className="h-6 w-6" />
          סמן כנקנה
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl"
            onClick={() => go(-1)}
            aria-label="הפריט הקודם"
          >
            <ChevronRight className="h-5 w-5" />
            הקודם
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl"
            onClick={() => go(1)}
            aria-label="הפריט הבא"
          >
            דלג
            <SkipForward className="h-4 w-4" />
            <ChevronLeft className="h-5 w-5" />
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
