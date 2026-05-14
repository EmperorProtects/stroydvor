import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/AppContext";

export default function Favorites() {
  const qc = useQueryClient();
  const { t } = useApp();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => base44.entities.Favorite.list("-created_date"),
  });

  const remove = async (fav) => {
    await base44.entities.Favorite.delete(fav.id);
    qc.invalidateQueries({ queryKey: ["favorites"] });
    toast.success(t("favorites") + " ✓");
  };

  const addToCart = async (fav) => {
    await base44.entities.CartItem.create({
      product_id: fav.product_id,
      product_title: fav.product_title,
      product_image: fav.product_image,
      product_price: fav.product_price,
      quantity: 1,
      unit: fav.product_unit || "шт",
    });
    qc.invalidateQueries({ queryKey: ["cartItems"] });
    toast.success(t("addToCart") + " ✓");
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-[#1A1A1A] text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">{t("favorites")}</h1>
          <p className="text-white/60 text-sm mt-1">{favorites.length} товаров</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 animate-pulse h-64" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">В избранном пусто</p>
            <p className="text-gray-400 text-sm mb-6">Добавляйте понравившиеся товары</p>
            <Link to="/catalog" className="inline-flex items-center px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: "#C0392B" }}>
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <Link to={`/product/${fav.product_id}`} className="block relative bg-gray-50 h-44 overflow-hidden">
                  {fav.product_image ? (
                    <img src={fav.product_image} alt={fav.product_title} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Нет фото</div>
                  )}
                </Link>
                <div className="p-3 flex flex-col flex-1">
                  <Link to={`/product/${fav.product_id}`} className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 hover:text-[#C0392B] transition-colors flex-1">
                    {fav.product_title}
                  </Link>
                  <p className="font-bold text-base text-gray-900 mb-3">
                    {(fav.product_price || 0).toLocaleString("ru-RU")} ₸
                    <span className="text-xs font-normal text-gray-400">/{fav.product_unit || "шт"}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(fav)}
                      className="flex-1 py-2 text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-1 hover:opacity-90"
                      style={{ backgroundColor: "#1A1A1A" }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> {t("addToCart")}
                    </button>
                    <button
                      onClick={() => remove(fav)}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}