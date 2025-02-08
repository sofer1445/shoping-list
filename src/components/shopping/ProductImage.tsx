interface ProductImageProps {
  productName: string;
  category: string;
}

export const ProductImage = ({ productName, category }: ProductImageProps) => {
  // Emoji mapping based on category
  const categoryEmojis: Record<string, string> = {
    "מזון": "🥘",
    "ירקות ופירות": "🥬",
    "מוצרי חלב": "🥛",
    "ניקיון": "🧹",
    "אחר": "📦",
  };

  // Get specific product emojis if we have them
  const productEmojis: Record<string, string> = {
    // Dairy products
    "חלב": "🥛",
    "milk": "🥛",
    "גבינה": "🧀",
    "cheese": "🧀",
    "יוגורט": "🥛",
    "yogurt": "🥛",
    
    // Fruits and vegetables
    "תפוח": "🍎",
    "apple": "🍎",
    "בננה": "🍌",
    "banana": "🍌",
    "תפוז": "🍊",
    "orange": "🍊",
    "לימון": "🍋",
    "lemon": "🍋",
    "ענבים": "🍇",
    "grapes": "🍇",
    "עגבניה": "🍅",
    "tomato": "🍅",
    "תפוח אדמה": "🥔",
    "potato": "🥔",
    "גזר": "🥕",
    "carrot": "🥕",
    "חסה": "🥬",
    "lettuce": "🥬",
    
    // Bread and grains
    "לחם": "🍞",
    "bread": "🍞",
    "פיתה": "🫓",
    "pita": "🫓",
    "אורז": "🍚",
    "rice": "🍚",
    
    // Proteins
    "ביצים": "🥚",
    "eggs": "🥚",
    "עוף": "🍗",
    "chicken": "🍗",
    "בשר": "🥩",
    "meat": "🥩",
    "דג": "🐟",
    "fish": "🐟",
    
    // Snacks
    "עוגיות": "🍪",
    "cookies": "🍪",
    "שוקולד": "🍫",
    "chocolate": "🍫",
    
    // Drinks
    "מים": "💧",
    "water": "💧",
    "קפה": "☕",
    "coffee": "☕",
    "תה": "🫖",
    "tea": "🫖",
    "יין": "🍷",
    "wine": "🍷",
    "בירה": "🍺",
    "beer": "🍺",

    // Cleaning products
    "סבון": "🧼",
    "soap": "🧼",
    "נייר טואלט": "🧻",
    "toilet paper": "🧻",
    "מטליות": "🧹",
    "wipes": "🧹",
    
    // Common household items
    "שקיות": "🛍️",
    "bags": "🛍️",
    "נרות": "🕯️",
    "candles": "🕯️",
  };

  const emoji = productEmojis[productName.toLowerCase()] || categoryEmojis[category] || "📝";

  return (
    <div className="w-8 h-8 flex items-center justify-center text-2xl">
      {emoji}
    </div>
  );
};