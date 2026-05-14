import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProductCard from "../ProductCard";
import { useApp } from "@/lib/AppContext";

export default function RelatedProducts({ currentProductId, category }) {
  const { t, lang } = useApp();

  const { data: products = [] } = useQuery({
    queryKey: ["relatedProducts", category, lang],
    queryFn: () => base44.entities.Product.filter({ category }, "-created_date", 5, lang),
    enabled: !!category,
  });

  const related = products.filter(p => p.id !== currentProductId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 border-t border-border">
      <h2 className="font-heading text-2xl font-bold mb-8">{t("relatedProducts")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {related.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
