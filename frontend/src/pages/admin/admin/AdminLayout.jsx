import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Image, Package, ShoppingBag, Layers, BookOpen, Star, ClipboardCheck, Truck, Tag, Settings, Info } from "lucide-react";

const navItems = [
  { label: "Дашборд", path: "/admin", icon: LayoutDashboard },
  { label: "Баннеры", path: "/admin/banners", icon: Image },
  { label: "Товары", path: "/admin/products", icon: Package },
  { label: "Категории", path: "/admin/categories", icon: Layers },
  { label: "Рекомендуемые", path: "/admin/featured", icon: Star },
  { label: "Доставка", path: "/admin/delivery", icon: Truck },
  { label: "Промокоды", path: "/admin/promos", icon: Tag },
  { label: "Заказы", path: "/admin/orders", icon: ShoppingBag },
  { label: "Настройки сайта", path: "/admin/settings", icon: Settings },
  { label: "О сайте", path: "/admin/info", icon: Info },
  { label: "Инструкция", path: "/admin/guide", icon: BookOpen },
  { label: "Тестирование", path: "/admin/testing", icon: ClipboardCheck },
];

export default function AdminLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1A1A1A] flex flex-col shrink-0 min-h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-bold text-lg">Админ панель</p>
          <p className="text-white/40 text-xs mt-0.5">Строй-Двор</p>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  active ? "bg-[#C0392B] text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <Link to="/" className="text-white/40 hover:text-white text-xs transition-colors">
            ← Вернуться на сайт
          </Link>
        </div>
      </aside>
      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}