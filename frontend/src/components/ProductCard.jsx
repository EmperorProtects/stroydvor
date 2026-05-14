import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApp } from "@/lib/AppContext";

export default function ProductCard({ product }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [addedToCart, setAddedToCart] = useState(false);
  const { t, tField } = useApp();

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => base44.entities.Favorite.list(),
    staleTime: 30000,
  });

  const isFavorited = favorites.some(f => f.product_id === product.id);

  // Локализованные поля
  const title = tField(product, "title");
  const category = tField(product, "category") || product.category;

  const addToCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    await base44.entities.CartItem.create({
      product_id: product.id,
      product_title: title,
      product_image: product.image,
      product_price: product.price,
      quantity: 1,
      unit: product.unit || "шт",
    });
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
    toast.success(t("addToCart") + " ✓");
    setAddedToCart(true);
  };

  const toggleFavorite = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const existing = favorites.find(f => f.product_id === product.id);
    if (existing) {
      await base44.entities.Favorite.delete(existing.id);
    } else {
      await base44.entities.Favorite.create({
        product_id: product.id,
        product_title: title,
        product_image: product.image,
        product_price: product.price,
        product_unit: product.unit,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["favorites"] });
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#C0392B] hover:-translate-y-0.5 flex flex-col h-[420px]">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={title}
              className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              {t("noPhoto")}
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_sale && (
              <Badge className="text-[10px] font-bold px-2 border-0" style={{ backgroundColor: "#C0392B" }}>
                {t("sale")}
              </Badge>
            )}
            {product.is_featured && !product.is_sale && (
              <Badge className="text-[10px] font-bold px-2 border-0 bg-amber-500">
                {t("featured")}
              </Badge>
            )}
          </div>
          <button onClick={toggleFavorite}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center transition-transform hover:scale-110">
            <Heart className="h-4 w-4 transition-colors"
              style={{ color: isFavorited ? "#C0392B" : "#ccc", fill: isFavorited ? "#C0392B" : "none" }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-gray-400 mb-1">{category}</p>
          <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 text-gray-900 group-hover:text-[#C0392B] transition-colors flex-1">
            {title}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-400 mb-2">{t("brand")}: {product.brand}</p>
          )}

          <div className="mb-3">
            {product.in_stock !== false ? (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{t("inStock")}</span>
            ) : (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{t("outOfStock")}</span>
            )}
          </div>

          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold" style={{ color: "#C0392B" }}>
                {(product.price || 0).toLocaleString("ru-RU")} ₸
              </span>
              {product.unit && <span className="text-xs text-gray-400">/ {product.unit}</span>}
            </div>
            {product.old_price && (
              <div className="text-xs text-gray-400 line-through mt-0.5">
                {product.old_price.toLocaleString("ru-RU")} ₸
              </div>
            )}
          </div>

          {product.in_stock !== false && (
            !addedToCart ? (
              <button onClick={addToCart}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 mt-auto"
                style={{ backgroundColor: "#C0392B" }}>
                <ShoppingCart className="h-4 w-4" /> {t("addToCart")}
              </button>
            ) : (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/checkout"); }}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 mt-auto"
                style={{ backgroundColor: "#27ae60" }}>
                {t("placeOrder")}
              </button>
            )
          )}
        </div>
      </div>
    </Link>
  );
}
