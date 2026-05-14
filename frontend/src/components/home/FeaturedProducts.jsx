import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProductCard from "../ProductCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";

export default function FeaturedProducts() {
  const { t, lang } = useApp();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["featuredProducts", lang],
    queryFn: () => base44.entities.Product.filter({ is_featured: true }, "-created_date", 8, lang),
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-5 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              {t("featured")} {t("products")}
            </h2>
            <p className="text-muted-foreground">{t("deliveryTime")}</p>
          </div>
          <Link to="/catalog" className="hidden sm:block">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
              {t("allCategories").replace("→","").trim()} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <motion.div key={product.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/catalog">
            <Button variant="outline" className="gap-2">
              {t("catalog")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
