import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  created_at: string;
  completed_at: string | null;
  list_id: string;
  created_by: string;
}

interface ProductAnalytics {
  user_id: string;
  product_name: string;
  category: string;
  total_purchases: number;
  average_quantity: number;
  last_purchased_at: string | null;
  purchase_frequency_days: number | null;
  seasonal_pattern: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error('user_id is required');
    }

    console.log(`Starting analytics processing for user: ${user_id}`);
    
    // Fetch ALL items for the user (not just archived)
    const { data: allItems, error: itemsError } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('created_by', user_id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }

    console.log(`Found ${allItems?.length || 0} total items for analysis`);

    if (!allItems || allItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No items found for analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process product analytics
    const productStats = new Map<string, {
      category: string;
      purchases: Array<{ quantity: number; date: string; completed: boolean }>;
    }>();

    allItems.forEach((item: ShoppingItem) => {
      const key = item.name.toLowerCase();
      if (!productStats.has(key)) {
        productStats.set(key, {
          category: item.category,
          purchases: []
        });
      }
      productStats.get(key)!.purchases.push({
        quantity: item.quantity,
        date: item.created_at,
        completed: item.completed
      });
    });

    // Calculate analytics for each product
    const analyticsToInsert: ProductAnalytics[] = [];
    
    for (const [productName, stats] of productStats) {
      const purchases = stats.purchases;
      const totalPurchases = purchases.length;
      const averageQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0) / totalPurchases;
      const lastPurchased = purchases[purchases.length - 1]?.date;
      
      // Calculate purchase frequency (days between purchases)
      let frequencyDays = null;
      if (purchases.length > 1) {
        const dates = purchases.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
        const intervals: number[] = [];
        for (let i = 1; i < dates.length; i++) {
          const daysDiff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
          intervals.push(daysDiff);
        }
        frequencyDays = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      }

      // Analyze seasonal patterns
      const seasonalPattern = analyzeSeasonalPattern(purchases);

      analyticsToInsert.push({
        user_id,
        product_name: productName,
        category: stats.category,
        total_purchases: totalPurchases,
        average_quantity: Number(averageQuantity.toFixed(2)),
        last_purchased_at: lastPurchased,
        purchase_frequency_days: frequencyDays ? Number(frequencyDays.toFixed(1)) : null,
        seasonal_pattern: seasonalPattern
      });
    }

    // Insert or update analytics
    console.log(`Upserting analytics for ${analyticsToInsert.length} products`);
    
    for (const analytics of analyticsToInsert) {
      const { error: upsertError } = await supabase
        .from('user_product_analytics')
        .upsert(analytics, { 
          onConflict: 'user_id,product_name',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Error upserting analytics:', upsertError);
      }
    }

    // Generate shopping predictions
    const predictions = generatePredictions(analyticsToInsert);
    
    if (predictions.length > 0) {
      console.log(`Inserting ${predictions.length} predictions`);
      
      const { error: predictionsError } = await supabase
        .from('shopping_predictions')
        .insert({
          user_id,
          predicted_items: predictions,
          prediction_period: 'weekly',
          confidence_score: calculateOverallConfidence(predictions)
        });

      if (predictionsError) {
        console.error('Error inserting predictions:', predictionsError);
      }
    }

    // Generate shopping patterns
    const patterns = generateShoppingPatterns(analyticsToInsert);
    
    for (const pattern of patterns) {
      const { error: patternError } = await supabase
        .from('user_shopping_patterns')
        .upsert({
          user_id,
          pattern_type: pattern.type,
          pattern_data: pattern.data,
          insights: pattern.insights
        }, { 
          onConflict: 'user_id,pattern_type',
          ignoreDuplicates: false 
        });

      if (patternError) {
        console.error('Error upserting pattern:', patternError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Analytics processing completed successfully',
        processed_products: analyticsToInsert.length,
        predictions_generated: predictions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analytics processing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function analyzeSeasonalPattern(purchases: Array<{ quantity: number; date: string }>) {
  const monthlyData: { [key: number]: number } = {};
  
  purchases.forEach(purchase => {
    const month = new Date(purchase.date).getMonth();
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  const sortedMonths = Object.entries(monthlyData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return {
    peak_months: sortedMonths.map(([month, count]) => ({
      month: parseInt(month),
      purchases: count
    })),
    total_months_active: Object.keys(monthlyData).length
  };
}

function generatePredictions(analytics: ProductAnalytics[]) {
  const currentDate = new Date();
  const predictions: Array<{
    product_name: string;
    category: string;
    confidence: number;
    predicted_quantity: number;
    reason: string;
  }> = [];

  analytics.forEach(product => {
    if (!product.last_purchased_at || !product.purchase_frequency_days) return;
    
    const lastPurchase = new Date(product.last_purchased_at);
    const daysSinceLast = (currentDate.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);
    
    // Predict if it's time to buy again
    const frequencyRatio = daysSinceLast / product.purchase_frequency_days;
    
    if (frequencyRatio >= 0.8) { // 80% of usual frequency has passed
      const confidence = Math.min(0.95, Math.max(0.3, frequencyRatio - 0.2));
      
      predictions.push({
        product_name: product.product_name,
        category: product.category,
        confidence: Number(confidence.toFixed(2)),
        predicted_quantity: Math.ceil(product.average_quantity),
        reason: `Usually purchased every ${Math.round(product.purchase_frequency_days)} days. Last purchased ${Math.round(daysSinceLast)} days ago.`
      });
    }
  });

  return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

function calculateOverallConfidence(predictions: any[]): number {
  if (predictions.length === 0) return 0;
  const average = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  return Number(average.toFixed(2));
}

function generateShoppingPatterns(analytics: ProductAnalytics[]) {
  const patterns = [];

  // Weekly pattern analysis
  const weeklyData = {
    high_frequency_items: analytics.filter(p => p.purchase_frequency_days && p.purchase_frequency_days <= 14).length,
    medium_frequency_items: analytics.filter(p => p.purchase_frequency_days && p.purchase_frequency_days > 14 && p.purchase_frequency_days <= 30).length,
    low_frequency_items: analytics.filter(p => p.purchase_frequency_days && p.purchase_frequency_days > 30).length,
    total_products: analytics.length
  };

  patterns.push({
    type: 'weekly',
    data: weeklyData,
    insights: generateWeeklyInsights(weeklyData)
  });

  // Category analysis
  const categoryData: { [key: string]: number } = {};
  analytics.forEach(product => {
    categoryData[product.category] = (categoryData[product.category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  patterns.push({
    type: 'category',
    data: { categories: topCategories, total_categories: Object.keys(categoryData).length },
    insights: generateCategoryInsights(topCategories)
  });

  return patterns;
}

function generateWeeklyInsights(data: any) {
  const insights = [];
  
  if (data.high_frequency_items > data.medium_frequency_items + data.low_frequency_items) {
    insights.push("אתה קונה הרבה פריטים בתדירות גבוהה - כדאי לשקול קניות בכמויות גדולות יותר");
  }
  
  if (data.low_frequency_items > data.high_frequency_items) {
    insights.push("רוב הקניות שלך הן פריטים שקונים לעיתים רחוקות - מצוין לתכנון מראש");
  }

  return insights;
}

function generateCategoryInsights(topCategories: Array<[string, number]>) {
  const insights = [];
  
  if (topCategories.length > 0) {
    insights.push(`הקטגוריה הכי פופולרית שלך היא ${topCategories[0][0]} עם ${topCategories[0][1]} פריטים שונים`);
  }
  
  if (topCategories.length >= 3) {
    insights.push(`אתה קונה בעיקר מ-3 קטגוריות: ${topCategories.slice(0, 3).map(([cat]) => cat).join(', ')}`);
  }

  return insights;
}