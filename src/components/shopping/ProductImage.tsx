import { useState, useEffect } from "react";

interface ProductImageProps {
  productName: string;
  category: string;
}

export const ProductImage = ({ productName, category }: ProductImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Default fallback images based on category
        const fallbackImages: Record<string, string> = {
          "מזון": "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg",
          "ירקות ופירות": "https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg",
          "מוצרי חלב": "https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg",
          "ניקיון": "https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg",
          "אחר": "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg",
        };

        // For now, we'll use category-based fallback images
        // In the future, we could integrate with Open Food Facts API for more specific product images
        setImageUrl(fallbackImages[category] || fallbackImages["אחר"]);
      } catch (error) {
        console.error("Error fetching product image:", error);
        setImageUrl(null);
      }
    };

    fetchImage();
  }, [productName, category]);

  if (!imageUrl) return null;

  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
      <img
        src={imageUrl}
        alt={productName}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
};