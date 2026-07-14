import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Sparkles, TrendingUp, RotateCcw, Package, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ["hsl(var(--primary))", "hsl(217 91% 75%)", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4"];

interface Analytics {
  product_name: string;
  category: string;
  total_purchases: number;
  purchase_frequency_days: number | null;
}

interface Pattern {
  pattern_type: string;
  insights: any;
}

export const InsightsScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [monthlyItems, setMonthlyItems] = useState(0);
  const [monthlyLists, setMonthlyLists] = useState(0);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [a, p, itemsRes, listsRes] = await Promise.all([
      supabase
        .from("user_product_analytics")
        .select("*")
        .eq("user_id", user.id)
        .order("total_purchases", { ascending: false })
        .limit(20),
      supabase.from("user_shopping_patterns").select("*").eq("user_id", user.id),
      supabase
        .from("shopping_items")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("completed", true)
        .gte("completed_at", monthAgo.toISOString()),
      supabase
        .from("shopping_lists")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("archived", true)
        .gte("archived_at", monthAgo.toISOString()),
    ]);

    setAnalytics((a.data as Analytics[]) || []);
    setPatterns((p.data as Pattern[]) || []);
    setMonthlyItems(itemsRes.count || 0);
    setMonthlyLists(listsRes.count || 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const topItem = analytics[0];

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    analytics.forEach((a) => {
      map[a.category] = (map[a.category] || 0) + a.total_purchases;
    });
    const total = Object.values(map).reduce((s, n) => s + n, 0);
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [analytics]);

  const topItems = analytics.slice(0, 5);
  const maxCount = topItems[0]?.total_purchases || 1;

  const repeatPatterns = analytics
    .filter((a) => a.purchase_frequency_days && a.purchase_frequency_days > 0)
    .slice(0, 4);

  const runAnalysis = async () => {
    if (!user) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("analytics-processor", {
        body: { user_id: user.id },
      });
      if (error) throw error;
      toast({ title: "הניתוח עודכן", description: `${data?.processed_products || 0} מוצרים` });
      await load();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="px-3 pt-3 space-y-3" dir="rtl">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-3 space-y-4" dir="rtl">
      <div className="flex items-center justify-between pt-1">
        <Button onClick={runAnalysis} disabled={running} size="sm" variant="outline" className="rounded-xl">
          <Bot className={running ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {running ? "מנתח..." : "רענן"}
        </Button>
        <h1 className="font-display text-xl font-bold">תובנות</h1>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="kpi-tile text-center">
          <Package className="h-4 w-4 mx-auto text-primary" />
          <div className="text-2xl font-display font-bold mt-1">{monthlyItems}</div>
          <div className="text-[10px] text-muted-foreground">פריטים החודש</div>
        </div>
        <div className="kpi-tile text-center">
          <Sparkles className="h-4 w-4 mx-auto text-primary" />
          <div className="text-2xl font-display font-bold mt-1">{monthlyLists}</div>
          <div className="text-[10px] text-muted-foreground">רשימות הושלמו</div>
        </div>
        <div className="kpi-tile text-center">
          <TrendingUp className="h-4 w-4 mx-auto text-primary" />
          <div className="text-sm font-display font-bold mt-1 truncate">
            {topItem?.product_name || "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">הכי נפוץ</div>
        </div>
      </div>

      {analytics.length === 0 ? (
        <div className="surface-card p-8 text-center space-y-3">
          <Sparkles className="h-10 w-10 mx-auto text-primary" />
          <div className="font-display font-semibold">אין עדיין תובנות</div>
          <p className="text-sm text-muted-foreground">
            סיים כמה רשימות ולחץ "רענן" כדי לקבל תובנות אישיות
          </p>
        </div>
      ) : (
        <>
          {/* Categories */}
          {categoryData.length > 0 && (
            <div className="surface-card p-4">
              <h2 className="font-display font-semibold text-sm mb-3 text-right">
                התפלגות קטגוריות
              </h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={52}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {categoryData.map((e, i) => (
                    <div key={e.name} className="flex items-center justify-between text-xs">
                      <span className="font-semibold tabular-nums">{e.pct}%</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{e.name}</span>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top items */}
          {topItems.length > 0 && (
            <div className="surface-card p-4">
              <h2 className="font-display font-semibold text-sm mb-3 text-right">
                הנקנים ביותר
              </h2>
              <div className="space-y-2">
                {topItems.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold w-4 text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1 relative h-8">
                      <div className="absolute inset-0 bg-muted/40 rounded-lg" />
                      <div
                        className="absolute inset-y-0 right-0 bg-primary/15 rounded-lg transition-all"
                        style={{ width: `${(p.total_purchases / maxCount) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-2.5">
                        <span className="text-[11px] tabular-nums font-semibold text-muted-foreground">
                          {p.total_purchases}×
                        </span>
                        <span className="text-xs font-medium truncate">{p.product_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repeat patterns */}
          {repeatPatterns.length > 0 && (
            <div className="surface-card p-4">
              <h2 className="font-display font-semibold text-sm mb-3 text-right flex items-center justify-end gap-2">
                תבניות קנייה חוזרות
                <RotateCcw className="h-4 w-4 text-primary" />
              </h2>
              <div className="space-y-2">
                {repeatPatterns.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2.5 bg-muted/30 rounded-xl"
                  >
                    <span className="text-muted-foreground">
                      כל ~{Math.round(p.purchase_frequency_days!)} ימים
                    </span>
                    <span className="font-medium">{p.product_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Textual patterns */}
          {patterns.map((p, i) =>
            Array.isArray(p.insights) && p.insights.length > 0 ? (
              <div key={i} className="surface-card p-4">
                <h2 className="font-display font-semibold text-sm mb-2 text-right">תובנות</h2>
                <ul className="space-y-1.5">
                  {p.insights.map((ins: string, k: number) => (
                    <li key={k} className="text-xs text-muted-foreground flex gap-1.5 justify-end">
                      <span>{ins}</span>
                      <span className="text-primary">•</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </>
      )}
    </div>
  );
};
