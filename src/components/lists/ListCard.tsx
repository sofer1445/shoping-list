import { ChevronLeft, Crown } from "lucide-react";
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
  const isShared = list.members.length > 1;
  const visibleMembers = list.members.slice(0, 3);
  const extra = list.members.length - visibleMembers.length;

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
            {list.is_owner && isShared && (
              <Crown className="h-3.5 w-3.5 text-amber-500" />
            )}
            <h3 className="font-display font-semibold text-[16px] truncate">{list.name}</h3>
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground text-right">
            {list.owner_name ? `של ${list.owner_name} · ` : ""}
            עודכן {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true, locale: he })}
          </div>

          {isShared && (
            <div className="mt-2 flex items-center gap-2 justify-end">
              <span className="text-[11px] text-muted-foreground truncate">
                {list.members.map((m) => m.name).slice(0, 2).join(" · ")}
                {list.members.length > 2 ? ` +${list.members.length - 2}` : ""}
              </span>
              <div className="flex items-center -space-x-1.5 space-x-reverse">
                {visibleMembers.map((m) => (
                  <div
                    key={m.id}
                    title={m.name + (m.is_owner ? " (בעלים)" : "")}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold",
                      m.is_owner
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-foreground/80"
                    )}
                  >
                    {m.initial}
                  </div>
                ))}
                {extra > 0 && (
                  <div className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                    +{extra}
                  </div>
                )}
              </div>
            </div>
          )}

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
