import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem } from './types';
import { Bot, TrendingUp, Target, ShoppingCart, Sparkles, Package, CheckCircle2, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  analytics: Array<{
    product_name: string;
    category: string;
    total_purchases: number;
    average_quantity: number;
    purchase_frequency_days: number | null;
  }>;
  predictions: Array<{
    predicted_items: any;
    confidence_score: number;
    prediction_period: string;
    created_at: string;
  }>;
  patterns: Array<{
    pattern_type: string;
    pattern_data: any;
    insights: any;
  }>;
}

interface StatisticsProps {
  items: ShoppingItem[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const Statistics: React.FC<StatisticsProps> = ({ items }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const statistics = useMemo(() => {
    const totalItems = items.length;
    const completedItems = items.filter(item => item.completed).length;
    const activeItems = totalItems - completedItems;
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    const categoryData: { [key: string]: number } = {};
    items.forEach(item => {
      categoryData[item.category] = (categoryData[item.category] || 0) + 1;
    });

    const pieData = Object.entries(categoryData).map(([category, count]) => ({
      name: category,
      value: count,
      percentage: Math.round((count / totalItems) * 100)
    }));

    const itemCounts: { [key: string]: number } = {};
    items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
    });

    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return { totalItems, completedItems, activeItems, completionRate, pieData, topItems };
  }, [items]);

  const runAnalyticsAgent = async () => {
    setIsProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('analytics-processor', {
        body: { user_id: userData.user.id }
      });

      if (error) throw error;

      toast({
        title: "✨ ניתוח הושלם בהצלחה",
        description: `נותחו ${data.processed_products} מוצרים ונוצרו ${data.predictions_generated} תחזיות`,
      });

      await loadAnalyticsData();
    } catch (error) {
      console.error('Error running analytics:', error);
      toast({
        title: "שגיאה בניתוח",
        description: error instanceof Error ? error.message : "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const [analyticsResult, predictionsResult, patternsResult] = await Promise.all([
        supabase.from('user_product_analytics').select('*').eq('user_id', userData.user.id).order('total_purchases', { ascending: false }),
        supabase.from('shopping_predictions').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_shopping_patterns').select('*').eq('user_id', userData.user.id)
      ]);

      if (analyticsResult.error) throw analyticsResult.error;
      if (predictionsResult.error) throw predictionsResult.error;
      if (patternsResult.error) throw patternsResult.error;

      setAnalyticsData({
        analytics: analyticsResult.data || [],
        predictions: predictionsResult.data || [],
        patterns: patternsResult.data || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadAnalyticsData();
  }, []);

  const hasPredictions = analyticsData?.predictions && analyticsData.predictions.length > 0 && analyticsData.predictions[0]?.predicted_items;
  const hasAnalytics = analyticsData?.analytics && analyticsData.analytics.length > 0;
  const hasPatterns = analyticsData?.patterns && analyticsData.patterns.length > 0;

  return (
    <div className="space-y-4 p-3" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-primary/10 rounded-2xl p-3 text-center">
          <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold text-primary">{statistics.totalItems}</div>
          <div className="text-[10px] text-muted-foreground font-medium">סה״כ</div>
        </div>
        <div className="bg-green-500/10 rounded-2xl p-3 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
          <div className="text-2xl font-bold text-green-600">{statistics.completedItems}</div>
          <div className="text-[10px] text-muted-foreground font-medium">הושלמו</div>
        </div>
        <div className="bg-amber-500/10 rounded-2xl p-3 text-center">
          <Package className="h-5 w-5 mx-auto mb-1 text-amber-600" />
          <div className="text-2xl font-bold text-amber-600">{statistics.activeItems}</div>
          <div className="text-[10px] text-muted-foreground font-medium">פעילים</div>
        </div>
      </div>

      {/* Completion Progress */}
      <Card className="border-0 shadow-sm bg-gradient-to-l from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">התקדמות</span>
            <span className="text-sm font-bold text-primary">{Math.round(statistics.completionRate)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${statistics.completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      {statistics.pieData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              התפלגות קטגוריות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={statistics.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {statistics.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {statistics.pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="font-semibold">{entry.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Items */}
      {statistics.topItems.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              פריטים פופולריים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1.5">
            {statistics.topItems.map((item, index) => {
              const maxCount = statistics.topItems[0].count;
              const width = (item.count / maxCount) * 100;
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4 text-center font-bold">{index + 1}</span>
                  <div className="flex-1 relative">
                    <div className="h-7 bg-muted/50 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-primary/15 rounded-lg transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-between px-2.5">
                      <span className="text-xs font-medium">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">{item.count}×</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-l from-violet-500/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">ניתוח חכם</h3>
              <p className="text-[10px] text-muted-foreground">תחזיות ותובנות על הרגלי הקנייה</p>
            </div>
          </div>
          <Button 
            onClick={runAnalyticsAgent}
            disabled={isProcessing}
            size="sm"
            className="w-full rounded-xl"
          >
            {isProcessing ? (
              <>
                <Bot className="h-4 w-4 animate-spin" />
                מנתח נתונים...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                הפעל ניתוח
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Bot className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">טוען נתוני ניתוח...</span>
        </div>
      )}

      {/* Predictions */}
      {hasPredictions && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              תחזיות קנייה
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {Array.isArray(analyticsData!.predictions[0].predicted_items) ? 
              analyticsData!.predictions[0].predicted_items.slice(0, 5).map((prediction: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{prediction.product_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {prediction.category} • כמות: {prediction.predicted_quantity}
                    </div>
                  </div>
                  <Badge 
                    variant={prediction.confidence > 0.7 ? "default" : "secondary"}
                    className="text-[10px] shrink-0 rounded-lg"
                  >
                    {Math.round(prediction.confidence * 100)}%
                  </Badge>
                </div>
              )) : null
            }
          </CardContent>
        </Card>
      )}

      {/* Product Analytics */}
      {hasAnalytics && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              סטטיסטיקות מוצרים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {analyticsData!.analytics.slice(0, 8).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{product.product_name}</div>
                  <div className="text-[10px] text-muted-foreground">{product.category}</div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-sm font-bold">{product.total_purchases}×</div>
                  {product.purchase_frequency_days && (
                    <div className="text-[10px] text-muted-foreground">
                      כל {Math.round(product.purchase_frequency_days)} ימים
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shopping Patterns */}
      {hasPatterns && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              תבניות קנייה
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {analyticsData!.patterns.map((pattern, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-xl">
                <div className="text-xs font-semibold mb-1.5">
                  {pattern.pattern_type === 'weekly' ? 'תדירות' : pattern.pattern_type === 'category' ? 'קטגוריות' : pattern.pattern_type}
                </div>
                {pattern.insights && Array.isArray(pattern.insights) && pattern.insights.map((insight: string, i: number) => (
                  <p key={i} className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {insight}
                  </p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
