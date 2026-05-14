import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Consultation, Promocode } from "@/api/apiClient";
import { Package, ShoppingBag, Image, Layers, FileText, Tag, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";

function StatusBadge({ status }) {
  const map = {
    new:         ["Новый",       "bg-blue-100 text-blue-700"],
    confirmed:   ["Подтверждён", "bg-yellow-100 text-yellow-700"],
    in_delivery: ["Доставка",    "bg-purple-100 text-purple-700"],
    completed:   ["Завершён",    "bg-green-100 text-green-700"],
    cancelled:   ["Отменён",     "bg-red-100 text-red-700"],
  };
  const [label, cls] = map[status] || ["—", "bg-gray-100 text-gray-500"];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function LeadDot({ status }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${
      status === "new" ? "bg-red-500 animate-pulse" :
      status === "done" ? "bg-green-500" : "bg-amber-500"
    }`} />
  );
}

export default function AdminDashboard() {
  const { data: products   = [] } = useQuery({ queryKey: ["products"],   queryFn: () => base44.entities.Product.list() });
  const { data: orders     = [] } = useQuery({ queryKey: ["orders"],     queryFn: () => base44.entities.Order.list() });
  const { data: banners    = [] } = useQuery({ queryKey: ["banners"],    queryFn: () => base44.entities.PromoBanner.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => base44.entities.Category.list() });
  const { data: leads      = [] } = useQuery({ queryKey: ["consultations"], queryFn: Consultation.list, refetchInterval: 30000 });
  const { data: promos     = [] } = useQuery({ queryKey: ["promocodes"], queryFn: Promocode.list });

  const newOrders  = orders.filter(o => o.status === "new").length;
  const newLeads   = leads.filter(l => l.status === "new").length;
  const revenue    = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const inStock    = products.filter(p => p.in_stock).length;

  const stats = [
    { label: "Товаров",     value: products.length,  icon: Package,    link: "/admin/products",    color: "#3B82F6", sub: `${inStock} в наличии` },
    { label: "Заказов",     value: orders.length,     icon: ShoppingBag, link: "/admin/orders",    color: "#C0392B", badge: newOrders > 0 ? `${newOrders} новых` : null },
    { label: "Выручка",     value: `${revenue.toLocaleString("ru-RU")} ₸`, icon: BarChart2, link: "/admin/orders", color: "#059669" },
    { label: "Заявок",      value: leads.length,      icon: FileText,   link: "/admin/promos",     color: "#8B5CF6", badge: newLeads > 0 ? `${newLeads} новых` : null },
    { label: "Баннеров",    value: banners.length,    icon: Image,      link: "/admin/banners",    color: "#EC4899" },
    { label: "Категорий",   value: categories.length, icon: Layers,     link: "/admin/categories", color: "#10B981" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Дашборд</h1>
      <p className="text-muted-foreground mb-8">Управление магазином Строй-Двор</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.link} className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "20" }}>
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                {s.badge && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">{s.badge}</span>}
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              {s.sub && <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Последние заказы</h2>
            <Link to="/admin/orders" className="text-sm text-[#C0392B] hover:underline">Все →</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Заказов пока нет</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{(o.total || 0).toLocaleString("ru-RU")} ₸</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              Заявки с форм
              {newLeads > 0 && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">{newLeads} новых</span>}
            </h2>
            <Link to="/admin/promos" className="text-sm text-[#C0392B] hover:underline">Все →</Link>
          </div>
          {leads.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Заявок пока нет</p>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <LeadDot status={l.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.message || l.phone}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(l.created_date).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
