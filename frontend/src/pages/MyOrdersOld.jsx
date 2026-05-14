import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle, Truck, XCircle, CreditCard, Store } from "lucide-react";

const PAYMENT_MAP = {
  kaspi:  { label: "Kaspi QR",         color: "text-red-600",   bg: "bg-red-50" },
  remote: { label: "Удалённая оплата", color: "text-blue-600",  bg: "bg-blue-50" },
  legal:  { label: "Юр. лицо",         color: "text-green-600", bg: "bg-green-50" },
};

const DELIVERY_MAP = {
  delivery: { label: "Доставка",  icon: Truck },
  pickup:   { label: "Самовывоз", icon: Store },
};

const STATUS_MAP = {
  new:         { label: "Новый",          color: "bg-blue-100 text-blue-700",   icon: Clock },
  confirmed:   { label: "Подтверждён",    color: "bg-yellow-100 text-yellow-700", icon: CheckCircle },
  in_delivery: { label: "В доставке",     color: "bg-purple-100 text-purple-700", icon: Truck },
  completed:   { label: "Завершён",       color: "bg-green-100 text-green-700",  icon: CheckCircle },
  cancelled:   { label: "Отменён",        color: "bg-red-100 text-red-700",      icon: XCircle },
};

export default function MyOrders() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["myOrders", user?.id],
    queryFn: () => user ? base44.entities.Order.myList() : Promise.resolve([]),
    enabled: !!user,
  });

  return (
    <div className="bg-background min-h-screen pb-24 sm:pb-0">
      <div className="py-10 sm:py-16" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-heading text-2xl sm:text-4xl font-bold text-white mb-1">Мои заказы</h1>
          <p className="text-white/50 text-sm">{orders.length} {orders.length === 1 ? "заказ" : "заказа"}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-lg mb-2">Заказов пока нет</h2>
            <p className="text-muted-foreground text-sm mb-6">Перейдите в каталог и выберите товары</p>
            <Link to="/catalog" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: "#C0392B" }}>
              В каталог
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.new;
              const StatusIcon = st.icon;
              const date = order.created_date ? new Date(order.created_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "—";
              const itemsCount = order.items?.length || 0;

              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs text-muted-foreground font-mono">#{order.id?.slice(-8)}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                        {order.payment_method && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_MAP[order.payment_method]?.bg} ${PAYMENT_MAP[order.payment_method]?.color}`}>
                            <CreditCard className="h-3 w-3" />
                            {PAYMENT_MAP[order.payment_method]?.label}
                          </span>
                        )}
                        {order.delivery_type && (() => { const DIcon = DELIVERY_MAP[order.delivery_type]?.icon || Truck; return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground">
                            <DIcon className="h-3 w-3" />
                            {DELIVERY_MAP[order.delivery_type]?.label}
                          </span>
                        ); })()}
                      </div>
                      <p className="font-semibold text-base">{(order.total || 0).toLocaleString("ru-RU")} ₸</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{date} · {itemsCount} {itemsCount === 1 ? "товар" : "товара"}</p>
                    </div>
                  </div>

                  {/* Items preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate flex-1 mr-2">{item.product_title} × {item.quantity}</span>
                          <span className="font-medium shrink-0">{((item.price || 0) * (item.quantity || 1)).toLocaleString("ru-RU")} ₸</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">+ ещё {order.items.length - 3} товара</p>
                      )}
                    </div>
                  )}

                  {/* Delivery info */}
                  {(order.customer_address || order.customer_phone) && (
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-0.5">
                      {order.customer_name && <p>{order.customer_name}</p>}
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