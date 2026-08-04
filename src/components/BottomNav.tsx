import { ListChecks, ShoppingCart, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "lists" | "shopping" | "history" | "insights";

const items: { key: TabKey; label: string; icon: typeof ListChecks }[] = [
  { key: "lists", label: "הרשימות", icon: ListChecks },
  { key: "shopping", label: "קניות", icon: ShoppingCart },
  { key: "history", label: "היסטוריה", icon: Clock },
  { key: "insights", label: "תובנות", icon: Sparkles },
];

interface BottomNavProps {
  value: TabKey;
  onChange: (v: TabKey) => void;
}

export const BottomNav = ({ value, onChange }: BottomNavProps) => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-md grid grid-cols-4 h-[72px]">
        {items.map(({ key, label, icon: Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 relative transition-all duration-200",
                "min-h-[44px] text-muted-foreground",
                active ? "text-primary scale-105" : "hover:text-foreground/80"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 h-1 w-12 rounded-full bg-primary animate-in fade-in slide-in-from-top-1" />
              )}
              <Icon 
                className={cn("h-[24px] w-[24px] transition-all", active ? "stroke-[2.5px]" : "stroke-[2px]")} 
              />
              <span className={cn("text-[12px] transition-all", active ? "font-bold" : "font-medium")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
