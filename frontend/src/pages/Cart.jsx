import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ChevronLeft, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Cart() {
  const queryClient = useQueryClient();
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const PROMOS = [
    { code: "СКИДКА10", label: "-10% на любой заказ", discount: 0.10, minAmount: 0 },
    { code: "OVER9000", label: "-20% при заказе от 9 000 ₸", discount: 0.20, minAmount: 9000 },
  ];

  const applyPromo = () => {
    const found = PROMOS.find(p => p.code === promo.trim().toUpperCase());
    if (!found) { toast.error("Промокод не найден"); return; }
    if (subtotal < found.minAmount) { toast.error(`Минимальная сумма заказа ${found.minAmount.toLocaleString("ru-RU")} ₸`); return; }
    setPromoApplied(true);
    setPromoDiscount(found.discount);
  };

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cartItems"],
    queryFn: () => base44.entities.CartItem.list("-created_date"),
  });

  const updateQuantity = async (item, newQty) => {
    if (newQty <= 0) {
      await base44.entities.CartItem.delete(item.id);
    } else {
      await base44.entities.CartItem.update(item.id, { quantity: newQty });
    }
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
  };

  const removeItem = async (item) => {
    await base44.entities.CartItem.delete(item.id);
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
    toast.success("Товар удалён из корзины");
  };

  const clearCart = async () => {
    for (const item of cartItems) {
      await base44.entities.CartItem.delete(item.id);
    }
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
    toast.success("Корзина очищена");
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product_price || 0) * (item.quantity || 1), 0);
  const discount = promoApplied ? Math.round(subtotal * promoDiscount) : 0;
  const total = subtotal - discount;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-foreground text-background py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Корзина</h1>
          <p className="text-background/60">{cartItems.length} товаров</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" /> Продолжить покупки
        </Link>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg mb-2">Корзина пуста</p>
            <p className="text-sm text-muted-foreground mb-6">Добавьте товары из каталога</p>
            <Link to="/catalog">
              <Button className="gap-2">
                Перейти в каталог <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-card rounded-lg border border-border"
                >
                  <div className="h-20 w-20 rounded-lg bg-secondary overflow-hidden shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        Фото
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product_title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.product_price?.toLocaleString("ru-RU")} ₸ / {item.unit || "шт"}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item, (item.quantity || 1) - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity || 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item, (item.quantity || 1) + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">
                          {((item.product_price || 0) * (item.quantity || 1)).toLocaleString("ru-RU")} ₸
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearCart}>
                Очистить корзину
              </Button>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg font-semibold">Итого</h3>
                  <button
                    onClick={() => setShowPromoModal(true)}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border"
                    style={{ color: "#C0392B", borderColor: "#C0392B" }}
                  >
                    <Gift className="h-3 w-3" /> Промокоды
                  </button>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Товаров:</span>
                    <span>{cartItems.reduce((s, i) => s + (i.quantity || 1), 0)} шт</span>
                  </div>
                  {/* <div className="flex justify-between"> */}
                  {/*   <span className="text-muted-foreground">Доставка:</span> */}
                  {/*   <span className="font-medium" style={{ color: "#C0392B" }}>Бесплатно</span> */}
                  {/* </div> */}
                  {promoApplied && (
                    <div className="flex justify-between" style={{ color: "#C0392B" }}>
                      <span>Скидка {Math.round(promoDiscount * 100)}%:</span>
                          <span>−{discount.toLocaleString("ru-RU")} ₸</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Сумма:</span>
                      <span>{total.toLocaleString("ru-RU")} ₸</span>
                    </div>
                  </div>
                </div>
                {/* Promo code */}
                <div
                  className="rounded-lg overflow-hidden flex mb-1 border"
                  style={{ borderColor: promoApplied ? "#16a34a" : "#e5e7eb" }}
                >
                  <input
                    type="text"
                    placeholder="Промокод"
                    value={promo}
                    onChange={(e) => { setPromo(e.target.value); setPromoApplied(false); }}
                    className="flex-1 px-3 py-2 text-sm outline-none bg-transparent uppercase"
                    disabled={promoApplied}
                  />
                  <button
                    onClick={applyPromo}
                    className="px-4 text-sm font-semibold text-white shrink-0"
                    style={{ backgroundColor: promoApplied ? "#16a34a" : "#C0392B" }}
                    disabled={promoApplied}
                  >
                    {promoApplied ? "✓" : "Применить"}
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-xs font-semibold mb-2" style={{ color: "#16a34a" }}>✓ Промокод введён!</p>
                )}
                <Link to="/checkout">
                  <Button className="w-full h-12 font-semibold text-white" style={{ backgroundColor: "#C0392B" }}>
                    Оформить заказ
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Менеджер свяжется с вами для подтверждения
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Promo Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowPromoModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Специальные промокоды</h3>
              <button onClick={() => setShowPromoModal(false)} className="text-muted-foreground hover:text-foreground">
                <Gift className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {PROMOS.map((p) => (
                <div key={p.code} className="border border-dashed rounded-xl p-4" style={{ borderColor: "#C0392B" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-base tracking-widest" style={{ color: "#C0392B" }}>{p.code}</span>
                    <button
                      onClick={() => { setPromo(p.code); setShowPromoModal(false); }}
                      className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: "#C0392B" }}
                    >
                      Применить
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">Нажмите «Применить», чтобы вставить код</p>
          </div>
        </div>
      )}
    </div>
  );
}
