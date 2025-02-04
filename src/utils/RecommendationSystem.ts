interface RecommendationData {
  [key: string]: string[];
}

interface UserPurchaseData {
  [key: string]: {
    [key: string]: {
      count: number;
      lastPurchased: number;
    };
  };
}

export class RecommendationSystem {
  private static readonly STORAGE_KEY = 'shopping_recommendations';
  private static readonly MAX_SUGGESTIONS = 3;
  private static readonly USAGE_THRESHOLD = 2;
  private static readonly DECAY_FACTOR = 0.8;
  private static readonly MAX_AGE_DAYS = 30;

  private static readonly staticRecommendations: RecommendationData = {
    'דגני בוקר': ['חלב', 'קערות חד פעמיות'],
    'פסטה': ['רוטב עגבניות', 'גבינה צהובה'],
    'לחם': ['חמאה', 'גבינה צהובה', 'ממרח שוקולד'],
    'בשר טחון': ['אורז', 'רוטב עגבניות', 'בצל'],
    'קפה': ['חלב', 'סוכר', 'עוגיות'],
    'ביצים': ['לחם', 'גבינה צהובה', 'ירקות'],
    'עגבניות': ['מלפפונים', 'בצל', 'שמן זית']
  };

  private userRecommendations: UserPurchaseData;

  constructor() {
    this.userRecommendations = this.loadUserRecommendations();
  }

  private loadUserRecommendations(): UserPurchaseData {
    try {
      const stored = localStorage.getItem(RecommendationSystem.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading recommendations:', error);
      return {};
    }
  }

  private saveUserRecommendations(): void {
    try {
      localStorage.setItem(
        RecommendationSystem.STORAGE_KEY,
        JSON.stringify(this.userRecommendations)
      );
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  }

  private calculateScore(count: number, lastPurchased: number): number {
    const daysSinceLastPurchase = (Date.now() - lastPurchased) / (1000 * 60 * 60 * 24);
    const ageDecay = Math.pow(RecommendationSystem.DECAY_FACTOR, daysSinceLastPurchase);
    return count * ageDecay;
  }

  public addPurchaseData(items: string[]): void {
    const timestamp = Date.now();

    items.forEach((item, i) => {
      if (!this.userRecommendations[item]) {
        this.userRecommendations[item] = {};
      }

      items.slice(i + 1).forEach(otherItem => {
        if (!this.userRecommendations[item][otherItem]) {
          this.userRecommendations[item][otherItem] = {
            count: 0,
            lastPurchased: timestamp
          };
        }

        this.userRecommendations[item][otherItem].count++;
        this.userRecommendations[item][otherItem].lastPurchased = timestamp;
      });
    });

    this.saveUserRecommendations();
    this.cleanupOldData();
  }

  public getRecommendations(item: string): string[] {
    const recommendations = new Map<string, number>();
    
    // Add static recommendations with base score
    const staticRecs = RecommendationSystem.staticRecommendations[item] || [];
    staticRecs.forEach(rec => recommendations.set(rec, 1));

    // Add user recommendations with calculated scores
    const userRecs = this.userRecommendations[item];
    if (userRecs) {
      Object.entries(userRecs).forEach(([rec, data]) => {
        const score = this.calculateScore(data.count, data.lastPurchased);
        if (score >= RecommendationSystem.USAGE_THRESHOLD) {
          recommendations.set(rec, score);
        }
      });
    }

    // Sort by score and return top recommendations
    return Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, RecommendationSystem.MAX_SUGGESTIONS)
      .map(([rec]) => rec);
  }

  public cleanupOldData(): void {
    const now = Date.now();
    const maxAge = RecommendationSystem.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    Object.keys(this.userRecommendations).forEach(item => {
      Object.entries(this.userRecommendations[item]).forEach(([rec, data]) => {
        if (now - data.lastPurchased > maxAge || 
            this.calculateScore(data.count, data.lastPurchased) < RecommendationSystem.USAGE_THRESHOLD) {
          delete this.userRecommendations[item][rec];
        }
      });

      if (Object.keys(this.userRecommendations[item]).length === 0) {
        delete this.userRecommendations[item];
      }
    });

    this.saveUserRecommendations();
  }
}