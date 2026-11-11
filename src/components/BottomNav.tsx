import { ListChecks, ShoppingCart, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card"
      aria-label="ניווט ראשי"
      dir="rtl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-2xl grid grid-cols-4 h-[76px] px-2 gap-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = value === key;
          return (
            <Button variant="ghost"
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative transition-colors h-full rounded-none px-1",
                "min-h-[44px] text-muted-foreground",
                active ? "text-primary bg-primary-soft" : "hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-10 bg-primary" />
              )}
              <Icon 
                className={cn("h-[24px] w-[24px] transition-all", active ? "stroke-[2.5px]" : "stroke-[2px]")} 
              />
              <span className={cn("text-[12px] transition-all", active ? "font-bold" : "font-medium")}>
                {label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
