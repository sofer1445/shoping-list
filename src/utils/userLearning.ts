import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem } from '@/components/shopping/types';

export interface UserPattern {
  userId: string;
  frequentItems: Array<{
    name: string;
    category: string;
    frequency: number;
    lastPurchased: Date;
  }>;
  categoryPreferences: Record<string, number>;
  shoppingTimes: Array<{
    dayOfWeek: number;
    hour: number;
    frequency: number;
  }>;
  seasonalPatterns: Record<string, string[]>;
}

export interface SmartRecommendation {
  item: string;
  category: string;
  confidence: number;
  reason: 'frequent_item' | 'seasonal' | 'time_based' | 'collaborative' | 'category_completion';
  explanation: string;
}

export class UserLearningSystem {
  private userId: string;
  private patterns: UserPattern | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async loadUserPatterns(): Promise<UserPattern> {
    if (this.patterns) return this.patterns;

    try {
      // Load user activity data
      const { data: activities, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Load shopping items history
      const { data: items, error: itemsError } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('created_by', this.userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (itemsError) throw itemsError;

      this.patterns = this.analyzeUserPatterns(activities || [], items || []);
      return this.patterns;
    } catch (error) {
      console.error('Error loading user patterns:', error);
      return this.getDefaultPatterns();
    }
  }

  private analyzeUserPatterns(activities: Array<Record<string, unknown>>, items: Array<Record<string, unknown>>): UserPattern {
    const frequentItems = this.analyzeFrequentItems(items);
    const categoryPreferences = this.analyzeCategoryPreferences(items);
    const shoppingTimes = this.analyzeShoppingTimes(activities);
    const seasonalPatterns = this.analyzeSeasonalPatterns(items);

    return {
      userId: this.userId,
      frequentItems,
      categoryPreferences,
      shoppingTimes,
      seasonalPatterns,
    };
  }

  private analyzeFrequentItems(items: Array<Record<string, unknown>>) {
    const itemFrequency = new Map<string, { count: number; category: string; lastPurchased: Date }>();

    items.forEach(item => {
      const key = item.name.toLowerCase();
      const existing = itemFrequency.get(key);
      const date = new Date(item.created_at);

      if (existing) {
        existing.count += 1;
        if (date > existing.lastPurchased) {
          existing.lastPurchased = date;
        }
      } else {
        itemFrequency.set(key, {
          count: 1,
          category: item.category,
          lastPurchased: date,
        });
      }
    });

    return Array.from(itemFrequency.entries())
      .map(([name, data]) => ({
        name,
        category: data.category,
        frequency: data.count,
        lastPurchased: data.lastPurchased,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50); // Top 50 frequent items
  }

  private analyzeCategoryPreferences(items: Array<Record<string, unknown>>) {
    const categoryCount = new Map<string, number>();

    items.forEach(item => {
      const category = item.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    const total = items.length;
    const preferences: Record<string, number> = {};

    categoryCount.forEach((count, category) => {
      preferences[category] = count / total;
    });

    return preferences;
  }

  private analyzeShoppingTimes(activities: Array<Record<string, unknown>>) {
    const timeFrequency = new Map<string, number>();

    activities.forEach(activity => {
      if (activity.activity_type === 'list_created' || activity.activity_type === 'item_added') {
        const date = new Date(activity.timestamp);
        const key = `${date.getDay()}-${date.getHours()}`;
        timeFrequency.set(key, (timeFrequency.get(key) || 0) + 1);
      }
    });

    return Array.from(timeFrequency.entries())
      .map(([key, frequency]) => {
        const [dayOfWeek, hour] = key.split('-').map(Number);
        return { dayOfWeek, hour, frequency };
      })
      .sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeSeasonalPatterns(items: Array<Record<string, unknown>>) {
    const seasonalItems = new Map<string, Set<string>>();
    
    items.forEach(item => {
      const date = new Date(item.created_at);
      const month = date.getMonth();
      
      let season: string;
      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'autumn';
      else season = 'winter';

      if (!seasonalItems.has(season)) {
        seasonalItems.set(season, new Set());
      }
      seasonalItems.get(season)!.add(item.name.toLowerCase());
    });

    const patterns: Record<string, string[]> = {};
    seasonalItems.forEach((items, season) => {
      patterns[season] = Array.from(items);
    });

    return patterns;
  }

  private getDefaultPatterns(): UserPattern {
    return {
      userId: this.userId,
      frequentItems: [],
      categoryPreferences: {},
      shoppingTimes: [],
      seasonalPatterns: {},
    };
  }

  async generateRecommendations(currentItems: ShoppingItem[]): Promise<SmartRecommendation[]> {
    const patterns = await this.loadUserPatterns();
    const recommendations: SmartRecommendation[] = [];
    const currentItemNames = new Set(currentItems.map(item => item.name.toLowerCase()));

    // Frequent items recommendations
    patterns.frequentItems
      .filter(item => !currentItemNames.has(item.name.toLowerCase()))
      .slice(0, 5)
      .forEach(item => {
        const daysSinceLastPurchase = Math.floor(
          (Date.now() - item.lastPurchased.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastPurchase >= 7) { // Suggest if not purchased in a week
          recommendations.push({
            item: item.name,
            category: item.category,
            confidence: Math.min(item.frequency / 10, 1),
            reason: 'frequent_item',
            explanation: `אתה קונה את זה בדרך כלל (${item.frequency} פעמים)`,
          });
        }
      });

    // Seasonal recommendations
    const currentSeason = this.getCurrentSeason();
    const seasonalItems = patterns.seasonalPatterns[currentSeason] || [];
    
    seasonalItems
      .filter(item => !currentItemNames.has(item.toLowerCase()))
      .slice(0, 3)
      .forEach(item => {
        recommendations.push({
          item,
          category: this.getCategoryByItem(item, patterns),
          confidence: 0.7,
          reason: 'seasonal',
          explanation: `מתאים לעונה הנוכחית`,
        });
      });

    // Category completion recommendations
    const currentCategories = new Set(currentItems.map(item => item.category));
    Object.entries(patterns.categoryPreferences)
      .filter(([category]) => !currentCategories.has(category))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .forEach(([category, preference]) => {
        const commonItem = this.getCommonItemForCategory(category, patterns);
        if (commonItem && !currentItemNames.has(commonItem.toLowerCase())) {
          recommendations.push({
            item: commonItem,
            category,
            confidence: preference,
            reason: 'category_completion',
            explanation: `השלמה לקטגוריית ${category}`,
          });
        }
      });

    // Load collaborative recommendations
    const collaborativeRecs = await this.getCollaborativeRecommendations(currentItems);
    recommendations.push(...collaborativeRecs);

    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Top 8 recommendations
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getCategoryByItem(itemName: string, patterns: UserPattern): string {
    const item = patterns.frequentItems.find(
      item => item.name.toLowerCase() === itemName.toLowerCase()
    );
    return item?.category || 'אחר';
  }

  private getCommonItemForCategory(category: string, patterns: UserPattern): string | null {
    const categoryItems = patterns.frequentItems.filter(item => item.category === category);
    return categoryItems.length > 0 ? categoryItems[0].name : null;
  }

  private async getCollaborativeRecommendations(currentItems: ShoppingItem[]): Promise<SmartRecommendation[]> {
    try {
      // Find users with similar shopping patterns
      const currentItemNames = currentItems.map(item => item.name.toLowerCase());
      
      const { data: similarLists, error } = await supabase
        .from('shopping_items')
        .select('name, category, created_by')
        .neq('created_by', this.userId)
        .in('name', currentItemNames);

      if (error) throw error;

      // Find users who bought similar items
      const userSimilarity = new Map<string, number>();
      
      similarLists?.forEach(item => {
        const userId = item.created_by;
        userSimilarity.set(userId, (userSimilarity.get(userId) || 0) + 1);
      });

      // Get recommendations from most similar users
      const similarUsers = Array.from(userSimilarity.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([userId]) => userId);

      if (similarUsers.length === 0) return [];

      const { data: recommendations, error: recError } = await supabase
        .from('shopping_items')
        .select('name, category')
        .in('created_by', similarUsers)
        .not('name', 'in', `(${currentItemNames.map(name => `'${name}'`).join(',')})`);

      if (recError) throw recError;

      const itemFrequency = new Map<string, { category: string; count: number }>();
      
      recommendations?.forEach(item => {
        const key = item.name.toLowerCase();
        const existing = itemFrequency.get(key);
        
        if (existing) {
          existing.count += 1;
        } else {
          itemFrequency.set(key, { category: item.category, count: 1 });
        }
      });

      return Array.from(itemFrequency.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 3)
        .map(([name, data]) => ({
          item: name,
          category: data.category,
          confidence: Math.min(data.count / 10, 0.8),
          reason: 'collaborative' as const,
          explanation: `משתמשים דומים קנו גם את זה`,
        }));

    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  async updateUserBehavior(action: 'item_added' | 'item_completed', itemData: Partial<ShoppingItem>) {
    // This method can be called to update user patterns in real-time
    // For now, we'll just invalidate the cached patterns
    this.patterns = null;
  }
}