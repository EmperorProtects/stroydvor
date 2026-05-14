import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, Phone, MapPin, CreditCard, Truck, Store } from "lucide-react";

const PAYMENT_MAP = {
  kaspi:  { label: "Kaspi QR",         color: "#C0392B",  bg: "bg-red-50 text-red-700" },
  remote: { label: "Удалённая оплата", color: "#2563EB",  bg: "bg-blue-50 text-blue-700" },
  legal:  { label: "Юр. лицо",         color: "#059669",  bg: "bg-green-50 text-green-700" },
};

const DELIVERY_MAP = {
  delivery: { label: "Доставка",   icon: Truck },
  pickup:   { label: "Самовывоз",  icon: Store },
};

const STATUS_MAP = {
  new: { label: "Новый", cls: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Подтверждён", cls: "bg-yellow-100 text-yellow-700" },
  in_delivery: { label: "Доставка", cls: "bg-purple-100 text-purple-700" },
  completed: { label: "Завершён", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Отменён", cls: "bg-red-100 text-red-600" },
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const { data: orders = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => base44.entities.Order.list("-created_date") });

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.customer_phone?.includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id, status) => {
    await base44.entities.Order.update(id, { status });
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <p className="text-muted-foreground text-sm mt-1">Общая выручка: <span className="font-semibold text-green-600">{totalRevenue.toLocaleString("ru-RU")} ₸</span></p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[["all", "Все"], ...Object.entries(STATUS_MAP).map(([k, v]) => [k, v.label])].map(([k, label]) => (
          <button key={k} onClick={() => setFilterStatus(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === k ? "bg-[#1A1A1A] text-white" : "bg-card border border-border text-foreground hover:bg-secondary"}`}>
            {label}
            {k !== "all" && <span className="ml-1 text-xs opacity-60">({orders.filter(o => o.status === k).length})</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Поиск по имени или телефону..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">Заказов не найдено</p>
        ) : filtered.map((o) => {
          const st = STATUS_MAP[o.status] || STATUS_MAP.new;
          const isExpanded = expanded === o.id;
          return (
            <div key={o.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : o.id)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold">{o.customer_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    {o.payment_method && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_MAP[o.payment_method]?.bg || "bg-gray-100 text-gray-600"}`}>
                        {PAYMENT_MAP[o.payment_method]?.label || o.payment_method}
                      </span>
                    )}
                    {o.delivery_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">
                        {DELIVERY_MAP[o.delivery_type]?.label || o.delivery_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.customer_phone}</span>
                    {o.customer_address && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{o.customer_address}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-base">{(o.total || 0).toLocaleString("ru-RU")} ₸</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_date).toLocaleDateString("ru-RU")}</p>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4 bg-secondary">
                  {/* Items */}
                  {o.items?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Товары</p>
                      <div className="space-y-1">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-foreground">{item.product_title} × {item.quantity}</span>
                            <span className="font-medium">{((item.price || 0) * (item.quantity || 1)).toLocaleString("ru-RU")} ₸</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Payment & Delivery details */}
                  <div className="flex gap-3 mb-4 flex-wrap">
                    {o.payment_method && (
                      <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${PAYMENT_MAP[o.payment_method]?.color}15`, color: PAYMENT_MAP[o.payment_method]?.color }}>
                        <CreditCard className="h-3.5 w-3.5" />
                        {PAYMENT_MAP[o.payment_method]?.label || o.payment_method}
                      </div>
                    )}
                    {o.delivery_type && (() => { const DI = DELIVERY_MAP[o.delivery_type]?.icon || Truck; return (
                      <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-secondary text-muted-foreground">
                        <DI className="h-3.5 w-3.5" />
                        {DELIVERY_MAP[o.delivery_type]?.label || o.delivery_type}
                      </div>
                    ); })()}
                  </div>
                  {o.comment && <p className="text-sm text-muted-foreground mb-4 italic">"{o.comment}"</p>}
                  {o.promo_code && <p className="text-sm text-green-600 mb-4">Промокод: <b>{o.promo_code}</b> (−{(o.discount || 0).toLocaleString("ru-RU")} ₸)</p>}

                  {/* Status change */}
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs font-semibold text-muted-foreground w-full">Изменить статус:</p>
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <button key={k} onClick={() => updateStatus(o.id, k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${o.status === k ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-card border-border text-foreground hover:bg-secondary"}`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}