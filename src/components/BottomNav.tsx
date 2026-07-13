import { ListChecks, Users, Archive, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "current" | "shared" | "archived" | "statistics";

const items: { key: TabKey; label: string; icon: typeof ListChecks }[] = [
  { key: "current", label: "רשימה", icon: ListChecks },
  { key: "shared", label: "משותפות", icon: Users },
  { key: "archived", label: "היסטוריה", icon: Archive },
  { key: "statistics", label: "תובנות", icon: BarChart3 },
];

interface BottomNavProps {
  value: TabKey;
  onChange: (v: TabKey) => void;
}

export const BottomNav = ({ value, onChange }: BottomNavProps) => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-md grid grid-cols-4 h-[68px]">
        {items.map(({ key, label, icon: Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative transition-colors",
                "min-h-[44px] text-muted-foreground hover:text-foreground",
                active && "text-primary"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
              <span className={cn("text-[11px]", active && "font-semibold")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
