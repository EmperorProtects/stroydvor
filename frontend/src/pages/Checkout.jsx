import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Promocode, SiteSettings } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft, Tag, Plus, Minus, Trash2,
  Truck, Store, AlertCircle, MapPin, ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import OrderSuccess from "../components/OrderSuccess";

const KASPI_DEFAULT = "https://pay.kaspi.kz/pay/nbvnqerz";

export default function Checkout() {
  const { t } = useApp();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name:    user?.name    || "",
    phone:   user?.phone   || "",
    address: user?.address || "",
    comment: "",
  });
  const [promo, setPromo]               = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoType, setPromoType]       = useState("percent");
  const [promoLabel, setPromoLabel]     = useState("");
  const [loading, setLoading]           = useState(false);
  const [orderId, setOrderId]           = useState(null);   // ID созданного заказа
  const [orderDone, setOrderDone]       = useState(false);  // финальный экран
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("kaspi");

  const { data: cartItems = [] } = useQuery({
    queryKey: ["cartItems"],
    queryFn: () => base44.entities.CartItem.list(),
  });

  const { data: deliverySettings = [] } = useQuery({
    queryKey: ["deliverySettings"],
    queryFn: () => base44.entities.DeliverySettings.list(),
  });

  const { data: siteSettings = {} } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => SiteSettings.get(),
    staleTime: 60_000,
  });

  const kaspiLink       = siteSettings.kaspi_pay_link  || KASPI_DEFAULT;
  const pickupAddress   = siteSettings.pickup_address  || siteSettings.address || "";
  const pickup2gisLink  = siteSettings.pickup_2gis_link || siteSettings.map_link || "";

  const activeDelivery     = deliverySettings.find(d => d.is_active);
  const deliveryEnabled    = !!activeDelivery;
  const effectiveDelivery  = !deliveryEnabled ? "pickup" : deliveryType;

  // ── Расчёт ────────────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce(
    (s, i) => s + (i.product_price || 0) * (i.quantity || 1), 0
  );
  const discount = promoApplied
    ? promoType === "percent"
      ? Math.round(subtotal * (promoDiscount / 100))
      : Math.min(promoDiscount, subtotal)
    : 0;

  let deliveryCost = 0;
  if (effectiveDelivery === "delivery" && activeDelivery) {
    deliveryCost = (activeDelivery.free_from > 0 && subtotal >= activeDelivery.free_from)
      ? 0
      : (activeDelivery.price_from || 0);
  }
  const total = subtotal - discount + deliveryCost;

  // ── Действия с корзиной ───────────────────────────────────────────────────
  const updateQty = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) await base44.entities.CartItem.delete(item.id);
    else             await base44.entities.CartItem.update(item.id, { quantity: newQty });
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
  };

  const removeItem = async (item) => {
    await base44.entities.CartItem.delete(item.id);
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
  };

  // ── Промокод ──────────────────────────────────────────────────────────────
  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    try {
      const data = await Promocode.validate(code);
      if (data.min_order && subtotal < data.min_order) {
        alert(`Минимальная сумма: ${data.min_order.toLocaleString("ru-RU")} ₸`);
        return;
      }
      setPromoApplied(true);
      setPromoType(data.discount_type);
      setPromoDiscount(data.discount_value);
      setPromoLabel(
        data.discount_type === "percent"
          ? `${data.discount_value}%`
          : `${data.discount_value.toLocaleString("ru-RU")} ₸`
      );
    } catch (e) {
      alert(e.message || "Промокод не найден");
    }
  };

  // ── Оформление: создаём заказ СРАЗУ, до оплаты ───────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (effectiveDelivery === "delivery" && !form.address.trim()) {
      alert(t("addressRequired"));
      return;
    }
    setLoading(true);
    try {
      const created = await base44.entities.Order.create({
        customer_name:    form.name,
        customer_phone:   form.phone,
        customer_address: effectiveDelivery === "pickup" ? pickupAddress : form.address,
        comment:          form.comment,
        delivery_type:    effectiveDelivery,
        payment_method:   paymentMethod,
        items: cartItems.map(i => ({
          product_id:    i.product_id,
          product_title: i.product_title,
          quantity:      i.quantity,
          price:         i.product_price,
          unit:          i.unit,
        })),
        subtotal,
        discount,
        delivery_cost: deliveryCost,
        total,
        promo_code: promoApplied ? promo.trim().toUpperCase() : "",
        status: "new",                 // сохраняется сразу, даже без оплаты
        payment_status: "pending",     // ждём оплату
      });

      setOrderId(created.id);

      // Очищаем корзину
      for (const item of cartItems) await base44.entities.CartItem.delete(item.id);
      queryClient.invalidateQueries({ queryKey: ["cartItems"] });
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });

      setLoading(false);

      // Для Kaspi — открываем ссылку оплаты в новой вкладке
      if (paymentMethod === "kaspi") {
        window.open(kaspiLink, "_blank", "noopener,noreferrer");
      }

      setOrderDone(true);
    } catch (err) {
      setLoading(false);
      alert(err.message || "Ошибка оформления заказа");
    }
  };

  // ── Финальный экран ───────────────────────────────────────────────────────
  if (orderDone) {
    return (
      <OrderSuccess
        orderData={{
          id:               orderId,
          customer_name:    form.name,
          customer_phone:   form.phone,
          customer_address: effectiveDelivery === "pickup" ? pickupAddress : form.address,
          total,
          discount,
          deliveryType:     effectiveDelivery,
          paymentMethod,
          kaspiLink,
          pickupAddress,
          pickup2gisLink,
        }}
      />
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24 sm:pb-0">
      <div className="py-12" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="font-heading text-3xl font-bold mb-2 text-white">{t("checkout")}</h1>
          <p className="text-white/60">{cartItems.length} {t("products")}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" /> {t("backToCart")}
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">

            {/* Delivery disabled notice */}
            {!deliveryEnabled && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">{t("deliveryDisabled")}</p>
              </div>
            )}

            {/* Способ получения */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-base mb-4">{t("deliveryMethod")}</h2>
              <div className="grid grid-cols-2 gap-3">
                <button type="button"
                  onClick={() => deliveryEnabled && setDeliveryType("delivery")}
                  disabled={!deliveryEnabled}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                    ${effectiveDelivery === "delivery" ? "border-[#C0392B] bg-red-50 dark:bg-red-950" : "border-border hover:border-gray-300"}
                    ${!deliveryEnabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                  <Truck className={`h-6 w-6 ${effectiveDelivery === "delivery" ? "text-[#C0392B]" : "text-muted-foreground"}`} />
                  <span className="font-medium text-sm">{t("delivery")}</span>
                  {activeDelivery && (
                    <span className="text-xs text-muted-foreground text-center">
                      {activeDelivery.free_from > 0 && subtotal >= activeDelivery.free_from
                        ? t("free")
                        : `${activeDelivery.price_from?.toLocaleString("ru-RU")} ₸`}
                    </span>
                  )}
                </button>

                <button type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${effectiveDelivery === "pickup" ? "border-[#C0392B] bg-red-50 dark:bg-red-950" : "border-border hover:border-gray-300"}`}>
                  <Store className={`h-6 w-6 ${effectiveDelivery === "pickup" ? "text-[#C0392B]" : "text-muted-foreground"}`} />
                  <span className="font-medium text-sm">{t("pickup")}</span>
                  <span className="text-xs text-muted-foreground">{t("free")}</span>
                </button>
              </div>

              {/* Адрес самовывоза */}
              {effectiveDelivery === "pickup" && pickupAddress && (
                <div className="mt-4 flex items-start gap-2.5 bg-secondary rounded-xl p-3.5">
                  <MapPin className="h-4 w-4 text-[#C0392B] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{pickupAddress}</p>
                    {pickup2gisLink && (
                      <a href={pickup2gisLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-1 font-semibold hover:underline"
                        style={{ color: "#C0392B" }}>
                        <ExternalLink className="h-3 w-3" /> Открыть в 2GIS
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Способ оплаты */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-base mb-4">{t("paymentMethod")}</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "kaspi",  label: t("payKaspi"),  color: "#C0392B" },
                  { key: "remote", label: t("payRemote"), color: "#2563EB" },
                  { key: "legal",  label: t("payLegal"),  color: "#059669" },
                ].map(opt => (
                  <button key={opt.key} type="button" onClick={() => setPaymentMethod(opt.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all cursor-pointer text-center
                      ${paymentMethod === opt.key ? "border-[#C0392B] bg-red-50 dark:bg-red-950" : "border-border hover:border-gray-300"}`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color }}>
                      <span className="text-white text-xs font-bold">₸</span>
                    </div>
                    <span className="text-xs font-medium leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
              {/* Подсказка про Kaspi */}
              {paymentMethod === "kaspi" && (
                <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#C0392B]" />
                  После оформления заказа откроется страница оплаты Kaspi
                </p>
              )}
            </div>

            {/* Контактные данные */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-lg mb-5">{t("contactInfo")}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("name")} *</label>
                  <Input placeholder={t("name")} value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("phone")} *</label>
                  <Input placeholder="+7 (___) ___-__-__" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                </div>
                {effectiveDelivery === "delivery" && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("address")} *</label>
                    <Input placeholder="Улица, дом, квартира" value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("comment")}</label>
                  <Input placeholder="Пожелания, уточнения..." value={form.comment}
                    onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} />
                </div>

                {/* Промокод */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("promo")}</label>
                  <div className="rounded-lg overflow-hidden flex border"
                    style={{ borderColor: promoApplied ? "#16a34a" : "#e5e7eb" }}>
                    <input type="text" placeholder={t("promo")} value={promo}
                      onChange={e => { setPromo(e.target.value); setPromoApplied(false); }}
                      className="flex-1 px-3 py-2 text-sm outline-none bg-transparent uppercase"
                      disabled={promoApplied} />
                    <button type="button" onClick={applyPromo}
                      className="px-4 text-sm font-semibold text-white shrink-0"
                      style={{ backgroundColor: promoApplied ? "#16a34a" : "#C0392B" }}
                      disabled={promoApplied}>
                      {promoApplied ? "✓" : t("applyPromo")}
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs font-semibold mt-1.5 flex items-center gap-1" style={{ color: "#16a34a" }}>
                      <Tag className="h-3 w-3" /> {t("promoApplied")} {promoLabel}
                    </p>
                  )}
                </div>

                <Button type="submit"
                  className="w-full h-12 font-semibold text-white mt-2"
                  style={{ backgroundColor: "#C0392B" }}
                  disabled={loading || cartItems.length === 0}>
                  {loading
                    ? t("processing")
                    : paymentMethod === "kaspi"
                      ? "Оформить и перейти к оплате →"
                      : t("toPayment")}
                </Button>
                <p className="text-xs text-center text-muted-foreground">{t("privacyNote")}</p>
              </form>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
              <h3 className="font-semibold mb-4">{t("yourOrder")}</h3>
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                      {item.product_image
                        ? <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.product_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.product_price || 0).toLocaleString("ru-RU")} ₸ / {item.unit || "шт"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => updateQty(item, -1)}
                        className="h-6 w-6 rounded flex items-center justify-center border border-border hover:bg-secondary transition-colors">
                        {(item.quantity || 1) === 1
                          ? <Trash2 className="h-3 w-3 text-red-500" />
                          : <Minus className="h-3 w-3 text-muted-foreground" />}
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity || 1}</span>
                      <button type="button" onClick={() => updateQty(item, 1)}
                        className="h-6 w-6 rounded flex items-center justify-center border border-border hover:bg-secondary transition-colors">
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                {promoApplied && (
                  <div className="flex justify-between" style={{ color: "#16a34a" }}>
                    <span>{t("discount")} {promoLabel}</span>
                    <span>−{discount.toLocaleString("ru-RU")} ₸</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("delivery")}</span>
                  <span className="font-medium" style={{ color: deliveryCost === 0 ? "#16a34a" : "inherit" }}>
                    {effectiveDelivery === "pickup"
                      ? t("pickup")
                      : deliveryCost === 0 ? t("free") : `${deliveryCost.toLocaleString("ru-RU")} ₸`}
                  </span>
                </div>
                {activeDelivery && effectiveDelivery === "delivery" && activeDelivery.free_from > 0 && subtotal < activeDelivery.free_from && (
                  <p className="text-xs text-muted-foreground">
                    {t("freeFrom")} {activeDelivery.free_from.toLocaleString("ru-RU")} ₸
                  </p>
                )}

                {/* Адрес самовывоза в summary */}
                {effectiveDelivery === "pickup" && pickupAddress && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Адрес самовывоза:</p>
                    <p className="text-xs font-medium">{pickupAddress}</p>
                    {pickup2gisLink && (
                      <a href={pickup2gisLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-1 font-semibold hover:underline"
                        style={{ color: "#C0392B" }}>
                        <ExternalLink className="h-3 w-3" /> Открыть 2GIS
                      </a>
                    )}
                  </div>
                )}

                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>{t("total")}</span>
                  <span>{total.toLocaleString("ru-RU")} ₸</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
