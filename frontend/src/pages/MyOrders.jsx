import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle, Truck, XCircle, CreditCard, Store, LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useApp } from "@/lib/AppContext";

const PAYMENT_MAP = {
  kaspi:  { label: "Kaspi QR",         color: "text-red-600",   bg: "bg-red-50 dark:bg-red-950" },
  remote: { label: "Удалённая оплата", color: "text-blue-600",  bg: "bg-blue-50 dark:bg-blue-950" },
  legal:  { label: "Юр. лицо",         color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
};

const DELIVERY_MAP = {
  delivery: { label: "Доставка",  icon: Truck },
  pickup:   { label: "Самовывоз", icon: Store },
};

const STATUS_MAP = {
  new:         { label: "Новый",       color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",       icon: Clock },
  confirmed:   { label: "Подтверждён", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: CheckCircle },
  in_delivery: { label: "В доставке",  color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Truck },
  completed:   { label: "Завершён",    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",   icon: CheckCircle },
  cancelled:   { label: "Отменён",     color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",           icon: XCircle },
};

function pluralOrders(n) {
  if (n % 10 === 1 && n % 100 !== 11) return "заказ";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "заказа";
  return "заказов";
}

function pluralItems(n) {
  if (n % 10 === 1 && n % 100 !== 11) return "товар";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "товара";
  return "товаров";
}

export default function MyOrders() {
  const { user, isLoadingAuth } = useAuth();
  const { t } = useApp();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["myOrders", user?.id],
    queryFn:  () => base44.entities.Order.myList(),
    enabled:  !!user,   // запрос только если залогинен
    staleTime: 30_000,
  });

  // ── Не залогинен ────────────────────────────────────────────────────────
  if (!isLoadingAuth && !user) {
    return (
      <div className="bg-background min-h-screen pb-24 sm:pb-0">
        <div className="py-10 sm:py-16" style={{ backgroundColor: "#1A1A1A" }}>
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="font-heading text-2xl sm:text-4xl font-bold text-white mb-1">Мои заказы</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Войдите в аккаунт</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Чтобы видеть свои заказы, войдите или зарегистрируйтесь
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/login" state={{ from: "/my-orders" }}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: "#C0392B" }}>
              Войти
            </Link>
            <Link to="/register" state={{ from: "/my-orders" }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24 sm:pb-0">
      {/* Hero */}
      <div className="py-10 sm:py-16" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-heading text-2xl sm:text-4xl font-bold text-white mb-1">Мои заказы</h1>
          {!isLoading && (
            <p className="text-white/50 text-sm">
              {orders.length} {pluralOrders(orders.length)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Загрузка */}
        {(isLoading || isLoadingAuth) && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Пусто */}
        {!isLoading && !isLoadingAuth && orders.length === 0 && (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-lg mb-2">Заказов пока нет</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Перейдите в каталог и выберите товары
            </p>
            <Link to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: "#C0392B" }}>
              В каталог
            </Link>
          </div>
        )}

        {/* Список заказов */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(order => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.new;
              const StatusIcon = st.icon;
              const DIcon = DELIVERY_MAP[order.delivery_type]?.icon || Truck;
              const payment = PAYMENT_MAP[order.payment_method];
              const date = order.created_date
                ? new Date(order.created_date).toLocaleDateString("ru-RU", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : "—";
              const itemsCount = order.items?.length || 0;

              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4 sm:p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-xs text-muted-foreground font-mono">
                          #{order.id?.slice(-8)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                        {payment && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${payment.bg} ${payment.color}`}>
                            <CreditCard className="h-3 w-3" />
                            {payment.label}
                          </span>
                        )}
                        {order.delivery_type && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground">
                            <DIcon className="h-3 w-3" />
                            {DELIVERY_MAP[order.delivery_type]?.label}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-lg">
                        {(order.total || 0).toLocaleString("ru-RU")} ₸
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {date} · {itemsCount} {pluralItems(itemsCount)}
                      </p>
                    </div>
                  </div>

                  {/* Товары */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-border pt-3 space-y-1.5">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate flex-1 mr-2">
                            {item.product_title} × {item.quantity} {item.unit || "шт"}
                          </span>
                          <span className="font-medium shrink-0">
                            {((item.price || 0) * (item.quantity || 1)).toLocaleString("ru-RU")} ₸
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          + ещё {order.items.length - 3} {pluralItems(order.items.length - 3)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Скидка / промокод */}
                  {(order.discount > 0 || order.promo_code) && (
                    <div className="border-t border-border pt-2 mt-2 flex items-center justify-between text-xs">
                      {order.promo_code && (
                        <span className="text-muted-foreground">Промокод: <b>{order.promo_code}</b></span>
                      )}
                      {order.discount > 0 && (
                        <span className="text-green-600 font-medium">
                          − {order.discount.toLocaleString("ru-RU")} ₸
                        </span>
                      )}
                    </div>
                  )}

                  {/* Контакт / адрес */}
                  {(order.customer_name || order.customer_address) && (
                    <div className="border-t border-border pt-2 mt-2 text-xs text-muted-foreground space-y-0.5">
                      {order.customer_name  && <p>{order.customer_name}</p>}
                      {order.customer_phone && <p>{order.customer_phone}</p>}
                      {order.customer_address && <p>{order.customer_address}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
