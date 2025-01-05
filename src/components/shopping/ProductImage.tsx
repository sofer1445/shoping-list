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
    "גבינה": "🧀",
    "יוגורט": "🥛",
    
    // Fruits and vegetables
    "תפוח": "🍎",
    "בננה": "🍌",
    "תפוז": "🍊",
    "לימון": "🍋",
    "ענבים": "🍇",
    "עגבניה": "🍅",
    "תפוח אדמה": "🥔",
    "גזר": "🥕",
    "חסה": "🥬",
    
    // Bread and grains
    "לחם": "🍞",
    "פיתה": "🫓",
    "אורז": "🍚",
    
    // Proteins
    "ביצים": "🥚",
    "עוף": "🍗",
    "בשר": "🥩",
    "דג": "🐟",
    
    // Snacks
    "עוגיות": "🍪",
    "שוקולד": "🍫",
    
    // Drinks
    "מים": "💧",
    "קפה": "☕",
    "תה": "🫖",
    "יין": "🍷",
    "בירה": "🍺",
  };

  const emoji = productEmojis[productName.toLowerCase()] || categoryEmojis[category] || "📝";

  return (
    <div className="w-8 h-8 flex items-center justify-center text-2xl">
      {emoji}
    </div>
  );
};