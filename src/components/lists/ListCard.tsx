import { ChevronLeft, Crown, Users2, Calendar } from "lucide-react";
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
        "w-full text-right bg-card rounded-2xl border border-border/60 p-5 active:scale-[0.98] transition-all duration-200 hover:shadow-lg hover:border-primary/20 group relative overflow-hidden",
        pct === 100 && "opacity-85"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-end gap-2 flex-wrap mb-1">
            {!list.is_owner && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-bold uppercase tracking-wider">
                משותפת
              </span>
            )}
            {list.is_owner && isShared && (
              <Crown className="h-4 w-4 text-amber-500 fill-amber-500/10" />
            )}
            <h3 className="font-display font-bold text-[17px] truncate leading-tight">{list.name}</h3>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
             <span>עודכן {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true, locale: he })}</span>
             <Calendar className="h-3 w-3" />
             {list.owner_name && <span className="mr-1">· של {list.owner_name}</span>}
          </div>

          <div className="mt-4 flex items-center justify-between">
            {isShared ? (
              <div className="flex items-center -space-x-1.5 space-x-reverse">
                {visibleMembers.map((m) => (
                  <div
                    key={m.id}
                    title={m.name}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold shadow-sm",
                      m.is_owner ? "bg-primary text-white" : "bg-muted-foreground/20 text-foreground"
                    )}
                  >
                    {m.initial}
                  </div>
                ))}
                {extra > 0 && (
                  <div className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                    +{extra}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
                <Users2 className="h-3.5 w-3.5" />
                <span>פרטית</span>
              </div>
            )}

            <div className="text-left">
              <span
                className={cn(
                  "text-[12px] font-bold tabular-nums",
                  pct === 100 ? "text-success" : "text-foreground/80"
                )}
              >
                {list.total === 0
                  ? "רשימה ריקה"
                  : remaining > 0
                  ? `${remaining} פריטים נותרו`
                  : "הכל מוכן ✓"}
              </span>
            </div>
          </div>

          <div className="mt-3 relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute right-0 h-full rounded-full transition-all duration-500 ease-out",
                pct === 100 ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
};
