import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, ChevronLeft, Truck, Shield, Package } from "lucide-react";
import { toast } from "sonner";
import PurchaseOptions from "../components/product/PurchaseOptions";
import RelatedProducts from "../components/product/RelatedProducts";
import { useApp } from "@/lib/AppContext";

export default function ProductDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { t, tField, lang } = useApp();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id, lang],
    queryFn: () => base44.entities.Product.get(id, lang),
  });

  // Локализованные поля
  const title       = product ? tField(product, "title")       : "";
  const description = product ? tField(product, "description") : "";

  const addToCart = async () => {
    await base44.entities.CartItem.create({
      product_id:    product.id,
      product_title: title,
      product_image: product.image,
      product_price: product.price,
      quantity,
      unit: product.unit || "шт",
    });
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
    toast.success(`${title} → ${t("cart")}`);
    setAddedToCart(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg">{t("productNotFound")}</p>
        <Link to="/catalog">
          <Button variant="outline" className="mt-4">{t("backToCatalogBtn")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ChevronLeft className="h-4 w-4" /> {t("backToCatalog")}
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative aspect-square bg-secondary rounded-xl overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {t("noPhoto")}
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              {product.is_sale && (
                <Badge className="bg-primary text-primary-foreground">{t("sale")}</Badge>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{title}</h1>
            {product.brand && (
              <p className="text-muted-foreground mb-4">{t("brand")}: {product.brand}</p>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold" style={{ color: "#C0392B" }}>
                {(product.price || 0).toLocaleString("ru-RU")} ₸
              </span>
              {product.unit && <span className="text-muted-foreground">/ {product.unit}</span>}
              {product.old_price && (
                <span className="text-lg text-muted-foreground line-through">
                  {product.old_price.toLocaleString("ru-RU")} ₸
                </span>
              )}
            </div>

            <Badge variant={product.in_stock !== false ? "default" : "secondary"} className="mb-4">
              {product.in_stock !== false ? t("inStock") : t("onOrder")}
            </Badge>

            {description && (
              <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>
            )}

            <PurchaseOptions product={product} />

            {/* Quantity + cart */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center border border-border rounded-lg">
                <Button variant="ghost" size="icon" className="h-10 w-10"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10"
                  onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {!addedToCart ? (
                <Button className="gap-2 flex-1 h-12 font-semibold" onClick={addToCart}>
                  <ShoppingCart className="h-4 w-4" /> {t("addToCart")}
                </Button>
              ) : (
                <Button className="flex-1 h-12 font-semibold" style={{ backgroundColor: "#27ae60" }}
                  onClick={() => navigate("/checkout")}>
                  {t("placeOrder")}
                </Button>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-3 pt-6 mt-6 border-t border-border">
              {[
                { icon: Truck,   text: t("deliveryTime") },
                { icon: Shield,  text: t("guarantee") },
                { icon: Package, text: t("returnPolicy") },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <b.icon className="h-4 w-4 text-primary shrink-0" />
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <RelatedProducts currentProductId={product.id} category={product.category} />
    </div>
  );
}
