import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Image, Package, ShoppingBag, Layers, BookOpen,
  Star, ClipboardCheck, Truck, Tag, Settings, Info,
  Eye, EyeOff, LogOut, Loader2
} from "lucide-react";
import { Auth } from "@/api/apiClient";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { label: "Дашборд",        path: "/admin",             icon: LayoutDashboard },
  { label: "Баннеры",        path: "/admin/banners",     icon: Image },
  { label: "Товары",         path: "/admin/products",    icon: Package },
  { label: "Категории",      path: "/admin/categories",  icon: Layers },
  { label: "Рекомендуемые",  path: "/admin/featured",    icon: Star },
  { label: "Доставка",       path: "/admin/delivery",    icon: Truck },
  { label: "Промокоды",      path: "/admin/promos",      icon: Tag },
  { label: "Заказы",         path: "/admin/orders",      icon: ShoppingBag },
  { label: "Настройки сайта",path: "/admin/settings",    icon: Settings },
  { label: "О сайте",        path: "/admin/info",        icon: Info },
  { label: "Инструкция",     path: "/admin/guide",       icon: BookOpen },
  { label: "Тестирование",   path: "/admin/testing",     icon: ClipboardCheck },
];

// ─── Login screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await Auth.adminLogin(username, password);
      onLogin();
    } catch {
      toast.error("Неверный логин или пароль");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`}</style>
      <div
        className="w-full max-w-sm bg-[#1A1A1A] rounded-2xl border border-white/10 p-8 space-y-6"
        style={{ animation: shake ? "shake 0.5s ease" : "" }}
      >
        {/* Logo */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-[#C0392B] flex items-center justify-center font-black text-xl text-white mx-auto mb-3">А</div>
          <h1 className="text-white font-bold text-lg">Админ панель</h1>
          <p className="text-white/40 text-xs mt-1">Строй-Двор</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Логин</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C0392B] transition-colors"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Пароль</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C0392B] transition-colors pr-10"
                placeholder="Введите пароль..."
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#C0392B" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  // Check token on mount and on every render
  const [authed, setAuthed] = useState(() => Auth.isAdmin());

  useEffect(() => {
    if (!Auth.isAdmin()) { setAuthed(false); return; }
    // Verify token is still valid by calling /auth/me
    Auth.me()
      .then(data => {
        if (data?.role !== 'admin') { Auth.clearTokens(); setAuthed(false); }
      })
      .catch(() => {
        Auth.clearTokens();
        setAuthed(false);
      });
  }, []);

  const handleLogin = () => {
    setAuthed(true);
    // Invalidate all queries so they refetch with the new token
    qc.invalidateQueries();
  };

  const handleLogout = () => {
    Auth.clearTokens();
    setAuthed(false);
    qc.clear();
    navigate("/admin");
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1A1A1A] flex flex-col shrink-0 min-h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-bold text-lg">Админ панель</p>
          <p className="text-white/40 text-xs mt-0.5">Строй-Двор</p>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
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

        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          <Link to="/" className="block text-white/40 hover:text-white text-xs transition-colors">
            ← Вернуться на сайт
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/30 hover:text-red-400 text-xs transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
