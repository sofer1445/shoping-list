import { ChevronLeft, Users, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { ListSummary } from "@/hooks/useLists";
import { cn } from "@/lib/utils";

interface Props {
  list: ListSummary;
  onOpen: (id: string) => void;
}

export const ListCard = ({ list, onOpen }: Props) => {
  const pct = list.total > 0 ? Math.round((list.completed / list.total) * 100) : 0;
  const remaining = list.total - list.completed;

  return (
    <button
      onClick={() => onOpen(list.id)}
      className={cn(
        "w-full text-right surface-card p-4 active:scale-[0.99] transition-all hover:shadow-md",
        pct === 100 && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ChevronLeft className="h-5 w-5 text-muted-foreground/60 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {!list.is_owner && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground font-medium">
                משותפת
              </span>
            )}
            {list.is_owner && list.participants > 1 && (
              <Crown className="h-3.5 w-3.5 text-amber-500" />
            )}
            <h3 className="font-display font-semibold text-[16px] truncate">{list.name}</h3>
          </div>

          <div className="mt-1 flex items-center gap-2 justify-end text-[11px] text-muted-foreground">
            {list.participants > 1 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {list.participants}
              </span>
            )}
            <span>·</span>
            <span>
              {list.owner_name ? `${list.owner_name} · ` : ""}
              עודכן {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true, locale: he })}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct === 100 ? "bg-success" : "bg-gradient-to-l from-primary to-primary/70"
                )}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold tabular-nums shrink-0",
                pct === 100 ? "text-success" : "text-foreground"
              )}
            >
              {list.total === 0
                ? "ריקה"
                : remaining > 0
                ? `${remaining} נותרו`
                : "הושלם ✓"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};
