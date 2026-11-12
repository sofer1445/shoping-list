import { ChevronLeft, Crown, Users2, Calendar, MoreVertical, Pencil, Copy, Archive, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { ListSummary } from "@/hooks/useLists";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  list: ListSummary;
  onOpen: (id: string) => void;
  onRename?: (list: ListSummary) => void;
  onDuplicate?: (list: ListSummary) => void;
  onArchive?: (list: ListSummary) => void;
  onDelete?: (list: ListSummary) => void;
}

export const ListCard = ({ list, onOpen, onRename, onDuplicate, onArchive, onDelete }: Props) => {
  const pct = list.total > 0 ? Math.round((list.completed / list.total) * 100) : 0;
  const remaining = list.total - list.completed;
  const isShared = list.members.length > 1;
  const visibleMembers = list.members.slice(0, 3);
  const extra = list.members.length - visibleMembers.length;
  const hasMenu = list.is_owner && (onRename || onDuplicate || onArchive || onDelete);

  return (
    <div
      className={cn(
        "w-full text-right bg-card rounded-lg border border-border p-5 transition-colors hover:border-primary/40 group relative",
        pct === 100 && "border-success/30"
      )}
    >
      <Button
        variant="ghost"
        className="absolute inset-0 h-full w-full rounded-lg hover:bg-transparent focus-visible:ring-inset"
        onClick={() => onOpen(list.id)}
        aria-label={`פתח את הרשימה ${list.name}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="order-last flex flex-col items-center gap-2 shrink-0">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="אפשרויות רשימה"
                  className="relative z-10 h-11 w-11 rounded-lg text-muted-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-44"
                onClick={(e) => e.stopPropagation()}
              >
                {onRename && (
                  <DropdownMenuItem onClick={() => onRename(list)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    שינוי שם
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(list)} className="gap-2">
                    <Copy className="h-4 w-4" />
                    שכפול רשימה
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(list)} className="gap-2">
                    <Archive className="h-4 w-4" />
                    העברה לארכיון
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(list)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      מחיקת רשימה
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {!list.is_owner && (
              <span className="text-xs px-2 py-0.5 rounded bg-accent text-accent-foreground font-semibold">
                משותפת
              </span>
            )}
            {list.is_owner && isShared && (
              <Crown className="h-4 w-4 text-warning" />
            )}
            <h3 className="font-display font-bold text-lg break-words leading-snug">{list.name}</h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
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
                      "h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-xs font-semibold",
                      m.is_owner ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
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
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users2 className="h-3.5 w-3.5" />
                <span>פרטית</span>
              </div>
            )}

            <div className="text-left">
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  pct === 100 ? "text-success" : "text-foreground/80"
                )}
              >
                {list.total === 0
                  ? "רשימה ריקה"
                  : remaining > 0
                  ? `${remaining} פריטים נותרו`
                  : "הכול נקנה"}
              </span>
            </div>
          </div>

          <div className="mt-3 relative h-1.5 w-full bg-muted rounded-full overflow-hidden" role="progressbar" aria-label="התקדמות הקנייה" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={cn(
                "absolute right-0 h-full rounded-full transition-all duration-500 ease-out",
                pct === 100 ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
