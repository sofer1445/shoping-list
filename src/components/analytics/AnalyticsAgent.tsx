import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, TrendingUp, Calendar, Target } from 'lucide-react';

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

const AnalyticsAgent: React.FC = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

      // Refresh analytics data
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

      // Load analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('user_product_analytics')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('total_purchases', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Load predictions
      const { data: predictions, error: predictionsError } = await supabase
        .from('shopping_predictions')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (predictionsError) throw predictionsError;

      // Load patterns
      const { data: patterns, error: patternsError } = await supabase
        .from('user_shopping_patterns')
        .select('*')
        .eq('user_id', userData.user.id);

      if (patternsError) throw patternsError;

      setAnalyticsData({
        analytics: analytics || [],
        predictions: predictions || [],
        patterns: patterns || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון את נתוני הניתוח",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadAnalyticsData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            סוכן ניתוח אינטליגנטי
          </CardTitle>
          <CardDescription>
            ניתוח חכם של הרגלי הקנייה שלך ותחזיות עתידיות
          </CardDescription>
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
          {analyticsData.predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  תחזיות קנייה חכמות
                </CardTitle>
                <CardDescription>
                  מוצרים שכדאי לך לקנות בזמן הקרוב
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.predictions[0]?.predicted_items?.slice(0, 5).map((prediction, index) => (
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
                      <div className="text-right">
                        <Badge variant={prediction.confidence > 0.7 ? "default" : "secondary"}>
                          {Math.round(prediction.confidence * 100)}% ביטחון
                        </Badge>
                        <Progress 
                          value={prediction.confidence * 100} 
                          className="w-20 mt-1"
                        />
                      </div>
                    </div>
                  ))}
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
                  סטטיסטיקות מוצרים
                </CardTitle>
                <CardDescription>
                  המוצרים שאתה קונה הכי הרבה
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.analytics.slice(0, 10).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.category}
                        </div>
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
                <CardDescription>
                  תובנות על הרגלי הקנייה שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.patterns.map((pattern, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                      <div className="font-medium mb-2 capitalize">
                        ניתוח {pattern.pattern_type === 'weekly' ? 'תדירות' : pattern.pattern_type === 'category' ? 'קטגוריות' : pattern.pattern_type}
                      </div>
                      {pattern.insights && pattern.insights.length > 0 && (
                        <ul className="space-y-1">
                          {pattern.insights.map((insight, i) => (
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
    </div>
  );
};

export default AnalyticsAgent;