import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem } from './types';
import { Bot, TrendingUp, Calendar, Target, BarChart3, ShoppingCart } from 'lucide-react';

interface Prediction {
  product_name: string;
  category: string;
  confidence: number;
  predicted_quantity: number;
  reason: string;
}

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Statistics: React.FC<StatisticsProps> = ({ items }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const statistics = useMemo(() => {
    const totalItems = items.length;
    const completedItems = items.filter(item => item.completed).length;
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Category distribution
    const categoryData: { [key: string]: number } = {};
    items.forEach(item => {
      categoryData[item.category] = (categoryData[item.category] || 0) + 1;
    });

    const pieData = Object.entries(categoryData).map(([category, count]) => ({
      name: category,
      value: count,
      percentage: Math.round((count / totalItems) * 100)
    }));

    // Daily activity (static example data)
    const dailyData = [
      { day: 'א', items: 8 },
      { day: 'ב', items: 12 },
      { day: 'ג', items: 15 },
      { day: 'ד', items: 10 },
      { day: 'ה', items: 7 },
      { day: 'ו', items: 14 },
      { day: 'ש', items: 9 }
    ];

    // Top items by usage
    const itemCounts: { [key: string]: number } = {};
    items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
    });

    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalItems,
      completedItems,
      completionRate,
      pieData,
      dailyData,
      topItems
    };
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
      setShowAIAnalysis(true);
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

  return (
    <div className="space-y-6 p-4">
      {/* Header with AI Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              סטטיסטיקות וניתוח חכם
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAIAnalysis(!showAIAnalysis)}
            >
              {showAIAnalysis ? 'נתונים בסיסיים' : 'ניתוח AI'}
            </Button>
          </CardTitle>
          <CardDescription>
            {showAIAnalysis ? 'ניתוח אינטליגנטי של הרגלי הקנייה שלך' : 'סטטיסטיקות כלליות על רשימת הקניות'}
          </CardDescription>
        </CardHeader>
      </Card>

      {showAIAnalysis ? (
        /* AI Analysis Section */
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                סוכן ניתוח אינטליגנטי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runAnalyticsAgent}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    מעבד נתונים...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    הפעל ניתוח מלא
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Bot className="h-8 w-8 animate-spin mr-2" />
                טוען נתוני ניתוח...
              </CardContent>
            </Card>
          ) : analyticsData ? (
            <>
              {/* Predictions */}
              {analyticsData.predictions.length > 0 && analyticsData.predictions[0]?.predicted_items && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      תחזיות קנייה חכמות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.isArray(analyticsData.predictions[0].predicted_items) ? 
                        analyticsData.predictions[0].predicted_items.slice(0, 5).map((prediction: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{prediction.product_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {prediction.category} • כמות צפויה: {prediction.predicted_quantity}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {prediction.reason}
                              </div>
                            </div>
                            <Badge variant={prediction.confidence > 0.7 ? "default" : "secondary"}>
                              {Math.round(prediction.confidence * 100)}% ביטחון
                            </Badge>
                          </div>
                        )) : (
                          <p className="text-muted-foreground">אין תחזיות זמינות</p>
                        )
                      }
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Product Analytics */}
              {analyticsData.analytics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      סטטיסטיקות מוצרים חכמות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.analytics.slice(0, 10).map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">{product.product_name}</div>
                            <div className="text-sm text-muted-foreground">{product.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{product.total_purchases} קניות</div>
                            <div className="text-sm text-muted-foreground">
                              כמות ממוצעת: {product.average_quantity}
                            </div>
                            {product.purchase_frequency_days && (
                              <div className="text-xs text-muted-foreground">
                                כל {Math.round(product.purchase_frequency_days)} ימים
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shopping Patterns */}
              {analyticsData.patterns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      תבניות קנייה
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.patterns.map((pattern, index) => (
                        <div key={index} className="p-4 bg-muted/50 rounded-lg">
                          <div className="font-medium mb-2 capitalize">
                            ניתוח {pattern.pattern_type === 'weekly' ? 'תדירות' : pattern.pattern_type === 'category' ? 'קטגוריות' : pattern.pattern_type}
                          </div>
                          {pattern.insights && Array.isArray(pattern.insights) && pattern.insights.length > 0 && (
                            <ul className="space-y-1">
                              {pattern.insights.map((insight: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">אין נתוני ניתוח עדיין</h3>
                <p className="text-muted-foreground mb-4">
                  הפעל את הסוכן החכם כדי לקבל תחזיות ותובנות על הרגלי הקנייה שלך
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Basic Statistics Section */
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">סה״כ פריטים</span>
                </div>
                <div className="text-2xl font-bold">{statistics.totalItems}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">אחוז השלמה</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(statistics.completionRate)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Category Distribution */}
          {statistics.pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>התפלגות לפי קטגוריות</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statistics.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statistics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Daily Activity */}
          <Card>
            <CardHeader>
              <CardTitle>פעילות שבועית</CardTitle>
              <CardDescription>כמות פריטים שנוספו ביום (נתונים לדוגמה)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statistics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="items" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Items */}
          {statistics.topItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  פריטים פופולריים
                </CardTitle>
                <CardDescription>המוצרים שמופיעים הכי הרבה ברשימות</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics.topItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.count} פעמים</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};