interface RecommendationData {
  [key: string]: string[];
}

export class RecommendationSystem {
  private static readonly STORAGE_KEY = 'shopping_recommendations';
  private static readonly MAX_SUGGESTIONS = 3;
  private static readonly USAGE_THRESHOLD = 2;

  private static readonly staticRecommendations: RecommendationData = {
    'דגני בוקר': ['חלב', 'קערות חד פעמיות'],
    'פסטה': ['רוטב עגבניות', 'גבינה צהובה'],
    'לחם': ['חמאה', 'גבינה צהובה', 'ממרח שוקולד'],
    'בשר טחון': ['אורז', 'רוטב עגבניות', 'בצל'],
    'קפה': ['חלב', 'סוכר', 'עוגיות'],
    'ביצים': ['לחם', 'גבינה צהובה', 'ירקות'],
    'עגבניות': ['מלפפונים', 'בצל', 'שמן זית']
  };

  private userRecommendations: Map<string, Map<string, number>>;

  constructor() {
    this.userRecommendations = this.loadUserRecommendations();
  }

  private loadUserRecommendations(): Map<string, Map<string, number>> {
    const stored = localStorage.getItem(RecommendationSystem.STORAGE_KEY);
    if (!stored) return new Map();

    const data = JSON.parse(stored);
    const recommendations = new Map();
    
    Object.entries(data).forEach(([key, value]) => {
      recommendations.set(key, new Map(Object.entries(value as object)));
    });

    return recommendations;
  }

  private saveUserRecommendations(): void {
    const data: { [key: string]: { [key: string]: number } } = {};
    
    this.userRecommendations.forEach((itemMap, key) => {
      data[key] = Object.fromEntries(itemMap);
    });

    localStorage.setItem(RecommendationSystem.STORAGE_KEY, JSON.stringify(data));
  }

  public addPurchaseData(items: string[]): void {
    items.forEach((item, i) => {
      items.slice(i + 1).forEach(otherItem => {
        if (!this.userRecommendations.has(item)) {
          this.userRecommendations.set(item, new Map());
        }
        const itemMap = this.userRecommendations.get(item)!;
        itemMap.set(otherItem, (itemMap.get(otherItem) || 0) + 1);
      });
    });
    this.saveUserRecommendations();
  }

  public getRecommendations(item: string): string[] {
    const recommendations = new Set<string>();
    
    // Add static recommendations
    const staticRecs = RecommendationSystem.staticRecommendations[item] || [];
    staticRecs.forEach(rec => recommendations.add(rec));

    // Add user recommendations
    const userRecs = this.userRecommendations.get(item);
    if (userRecs) {
      Array.from(userRecs.entries())
        .filter(([_, count]) => count >= RecommendationSystem.USAGE_THRESHOLD)
        .sort((a, b) => b[1] - a[1])
        .forEach(([rec]) => recommendations.add(rec));
    }

    return Array.from(recommendations).slice(0, RecommendationSystem.MAX_SUGGESTIONS);
  }

  public cleanupOldData(): void {
    // Remove items with low usage counts
    this.userRecommendations.forEach((itemMap, key) => {
      itemMap.forEach((count, recItem) => {
        if (count < RecommendationSystem.USAGE_THRESHOLD) {
          itemMap.delete(recItem);
        }
      });
      if (itemMap.size === 0) {
        this.userRecommendations.delete(key);
      }
    });
    this.saveUserRecommendations();
  }
}