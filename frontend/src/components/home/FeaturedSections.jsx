import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/AppContext";

function ProductCardMini({ product }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [addedToCart, setAddedToCart] = useState(false);
  const { t, tField } = useApp();

  const title = tField(product, "title");

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <Link
      to={`/product/${product.id}`}
      className="shrink-0 bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
      style={{ width: "220px" }}
    >
      <div className="relative bg-gray-50 flex items-center justify-center overflow-hidden" style={{ height: "200px" }}>
        {product.is_sale && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded text-white z-10" style={{ backgroundColor: "#C0392B" }}>
            Скидка
          </span>
        )}
        {product.image ? (
          <img src={product.image} alt={title} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="text-gray-300 text-sm">Нет фото</div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {product.brand && (
          <p className="text-xs text-gray-400 mb-0.5">Арт. {product.brand}</p>
        )}
        <p className="text-sm text-gray-800 line-clamp-3 mb-3 leading-snug flex-1">{title}</p>
        <p className="font-bold text-lg text-gray-900">
          {(product.price || 0).toLocaleString("ru-RU")} ₸
          <span className="text-sm font-normal text-gray-500">/{product.unit || "шт"}</span>
        </p>
        {product.old_price && (
          <p className="text-xs text-gray-400 line-through">{product.old_price.toLocaleString("ru-RU")} ₸</p>
        )}
        {!addedToCart ? (
          <button
            className="mt-3 w-full py-2 text-sm font-semibold text-white rounded transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1A1A1A" }}
            onClick={addToCart}
          >
            В корзину
          </button>
        ) : (
          <button
            className="mt-3 w-full py-2 text-sm font-semibold text-white rounded transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#27ae60" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/checkout"); }}
          >
            Оформить заказ
          </button>
        )}
      </div>
    </Link>
  );
}

function SectionRow({ section, products }) {
  const scrollRef = useRef(null);
  const sectionProducts = products.filter(p => (section.product_ids || []).includes(p.id));
  if (sectionProducts.length === 0) return null;

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  return (
    <div className="py-8 border-b border-gray-100 last:border-0">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{section.section_title}</h2>
          <Link
            to="/catalog"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Смотреть всё <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products scroll */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sectionProducts.map((product) => (
              <ProductCardMini key={product.id} product={product} />
            ))}
          </div>

          {/* Arrow right */}
          {sectionProducts.length > 4 && (
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full border shadow flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedSections() {
  const { lang } = useApp();

  const { data: sections = [] } = useQuery({
    queryKey: ["featuredSections"],
    queryFn: () => base44.entities.FeaturedSection.list("sort_order"),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products", lang],
    queryFn: () => base44.entities.Product.list("-created_date", 500, lang),
  });

  const activeSections = sections.filter(s => s.is_active);

  if (activeSections.length === 0) {
    return (
      <div className="py-10 border-b">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          Добавьте рекомендуемые секции в{" "}
          <a href="/admin/featured" className="underline hover:text-gray-700">Админ панели</a>,
          чтобы здесь появились товары.
        </div>
      </div>
    );
  }

  return (
    <div> 
      {activeSections.map(section => (
        <SectionRow key={section.id} section={section} products={products} />
      ))}
    </div>
  );
}
