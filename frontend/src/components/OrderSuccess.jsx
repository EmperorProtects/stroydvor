import { Link } from "react-router-dom";
import { CheckCircle, Phone, MapPin, ExternalLink, Package, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderSuccess({ orderData = {} }) {
  const {
    id, customer_name, customer_phone, customer_address,
    total = 0, discount = 0,
    deliveryType, paymentMethod,
    kaspiLink, pickupAddress, pickup2gisLink,
  } = orderData;

  const isKaspi  = paymentMethod === "kaspi";
  const isPickup = deliveryType  === "pickup";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">

        {/* Иконка успеха */}
        <div className="text-center mb-6">
          <div className="h-20 w-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "#E8F5E9" }}>
            <CheckCircle className="h-10 w-10" style={{ color: "#27ae60" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Заказ оформлен!</h1>
          <p className="text-muted-foreground text-sm">
            {isKaspi
              ? "Перейдите к оплате через Kaspi. Ваш заказ уже сохранён."
              : "Менеджер свяжется с вами и уточнит детали."}
          </p>
        </div>

        {/* Карточка заказа */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Сумма</span>
            <span className="font-bold text-lg" style={{ color: "#C0392B" }}>
              {total.toLocaleString("ru-RU")} ₸
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Скидка</span>
              <span className="text-green-600">−{discount.toLocaleString("ru-RU")} ₸</span>
            </div>
          )}
          {id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">№ заказа</span>
              <span className="font-mono text-xs font-semibold">#{id.slice(-8)}</span>
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-2">
            {customer_name && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-24 shrink-0">Получатель</span>
                <span className="font-medium">{customer_name}</span>
              </div>
            )}
            {customer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{customer_phone}</span>
              </div>
            )}
            {customer_address && !isPickup && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="font-medium">{customer_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Самовывоз: адрес + 2GIS */}
        {isPickup && pickupAddress && (
          <div className="bg-secondary rounded-xl p-4 mb-4 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-[#C0392B] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold mb-0.5">Адрес самовывоза</p>
              <p className="text-sm text-muted-foreground">{pickupAddress}</p>
              {pickup2gisLink && (
                <a href={pickup2gisLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-2 hover:underline"
                  style={{ color: "#C0392B" }}>
                  <ExternalLink className="h-3 w-3" /> Открыть в 2GIS
                </a>
              )}
            </div>
          </div>
        )}

        {/* Kaspi: большая кнопка оплаты */}
        {isKaspi && kaspiLink && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> Оплата через Kaspi
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mb-3">
              Страница оплаты уже открылась в новой вкладке. Если нет — нажмите кнопку ниже.
            </p>
            <a href={kaspiLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C0392B" }}>
              <ExternalLink className="h-4 w-4" /> Оплатить в Kaspi
            </a>
          </div>
        )}

        {/* Ожидание звонка (не Kaspi) */}
        {!isKaspi && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-1">
              📞 Ожидайте звонка менеджера
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Обычно перезваниваем в течение 30–60 минут в рабочее время.
            </p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/my-orders" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Package className="h-4 w-4" /> Мои заказы
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button className="w-full text-white font-semibold" style={{ backgroundColor: "#C0392B" }}>
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
