import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, X, ChevronRight, Phone, MapPin, Grid3X3, Heart, Sun, Moon, User, Package, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Logo from "@/components/layout/Logo.jsx";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { loadSettings } from "@/hooks/useSettings";
import logo from "@/static/logo.png";

// ─── Debounce hook ─────────────────────────────────────────────────────────
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Lang config ───────────────────────────────────────────────────────────
const LANG_CONFIG = [
  { code: "ru", label: "RU", flag: "🇷🇺", name: "Русский" },
  { code: "kz", label: "KZ", flag: "🇰🇿", name: "Қазақша" },
  { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
];

export default function Header() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [visible, setVisible]       = useState(true);
  const [langOpen, setLangOpen]     = useState(false);

  const lastScrollY  = useRef(0);
  const menuRef      = useRef(null);
  const searchRef    = useRef(null);
  const langRef      = useRef(null);
  const inputRef     = useRef(null);

  const location  = useLocation();
  const navigate  = useNavigate();
  const { theme, setTheme, lang, setLang, t } = useApp();
  const { user, logout } = useAuth();
  const settings  = loadSettings();

  const debouncedQuery = useDebounce(searchQuery, 350);

  // ── Autocomplete query ───────────────────────────────────────────────────
  const { data: suggestions = [], isFetching: sugFetching } = useQuery({
    queryKey: ["searchSuggest", debouncedQuery, lang],
    queryFn: () => base44.entities.Product.filter(
      { search: debouncedQuery }, "-created_date", 6, lang
    ),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  // ── Scroll hide/show ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth < 640;
      if (isMobile) { setVisible(true); return; }
      const currentY = window.scrollY;
      if (currentY < 80)                    setVisible(true);
      else if (currentY < lastScrollY.current) setVisible(true);
      else { setVisible(false); setMenuOpen(false); }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Close menu on outside click ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close on route change ────────────────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  // ── Show dropdown when suggestions arrive ────────────────────────────────
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) setShowDropdown(true);
    else setShowDropdown(false);
  }, [debouncedQuery, suggestions]);

  // ── Cart & Favorites ─────────────────────────────────────────────────────
  const { data: cartItems = [] } = useQuery({
    queryKey: ["cartItems"],
    queryFn: () => base44.entities.CartItem.list(),
  });
  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => base44.entities.Favorite.list(),
  });
  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const favCount  = favorites.length;

  // ── Search submit → /products?search=... ────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setShowDropdown(false);
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
    else   navigate("/products");
  };

  const handleSuggestionClick = (product) => {
    setSearchQuery("");
    setShowDropdown(false);
    navigate(`/product/${product.id}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getTitle = (p) =>
    p[`title_${lang}`] || p.title_ru || p.title || "";

  const menuItems = [
    { label: t("catalog"),  desc: t("catalogDesc")   || "Всё для стройки, ремонта и обустройства", link: "/catalog",    icon: Grid3X3 },
    { label: t("about"),    desc: t("aboutDesc")     || "История компании и наши преимущества",     link: "/about",      icon: null },
    { label: t("contacts"), desc: settings.city ? `${settings.city}` : "г. Астана, телефоны отделов", link: "/contacts", icon: Phone },
    { label: t("myOrders"), desc: t("myOrdersDesc")  || "История и статус заказов",                  link: "/my-orders", icon: Package },
  ];

  const IconBtn = ({ to, icon: Icon, label, badge }) => (
    <Link to={to} className="relative flex flex-col items-center gap-0.5 px-1 text-foreground hover:text-[#C0392B] transition-colors shrink-0">
      <Icon className="h-5 w-5" />
      {badge > 0 && (
        <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] border-0 leading-none" style={{ backgroundColor: "#C0392B" }}>
          {badge}
        </Badge>
      )}
      <span className="text-[10px] font-medium leading-none opacity-70">{label}</span>
    </Link>
  );

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
      )}

      {/* ── Slide-out menu ─────────────────────────────────────────────── */}
      <div
        ref={menuRef}
        className="fixed top-0 left-0 h-full w-72 bg-card z-50 shadow-2xl flex flex-col transition-transform duration-300"
        style={{ transform: menuOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ backgroundColor: "#1A1A1A" }}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <img src={logo} alt="Logo" className="h-10 flex object-contain" />
          </Link>
          <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {menuItems.map((item) => (
            <Link key={item.label} to={item.link}
              className="flex items-center justify-between px-5 py-4 hover:bg-secondary transition-colors group border-b border-border">
              <div>
                <p className="font-semibold text-foreground text-base group-hover:text-[#C0392B] transition-colors">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#C0392B] transition-colors" />
            </Link>
          ))}
        </nav>

        {/* Theme + Lang в меню */}
        <div className="px-5 py-3 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? t("lightTheme") : t("darkTheme")}
            </button>
          </div>
          {/* Языковые кнопки */}
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {LANG_CONFIG.map(({ code, label, flag, name }) => (
              <button key={code} onClick={() => setLang(code)} title={name}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all
                  ${lang === code ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {flag} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border bg-secondary/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4 text-[#C0392B]" />
            <span>{settings.city || "г. Астана"}</span>
          </div>
          <div className="space-y-1">
            {["phone","phone2","phone3","phone4","phone5"].map(key => settings[key] ? (
              <div key={key}>
                <a href={`tel:${settings[key].replace(/\D/g,"")}`} className="text-xs font-semibold text-foreground hover:text-[#C0392B] transition-colors block">
                  {settings[key]}
                </a>
                {settings[key+"_label"] && <span className="text-[10px] text-muted-foreground">{settings[key+"_label"]}</span>}
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      {/* ── Desktop Header ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 transition-transform duration-300"
        style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 w-full">

            <Link to="/" className="shrink-0">
              <img src={logo} alt="Logo" className="h-8 sm:h-10" />
            </Link>

            <button onClick={() => setMenuOpen(true)}
              className="flex flex-col justify-center items-center gap-1.5 w-10 h-10 rounded-lg transition-colors hover:bg-secondary shrink-0"
              aria-label={t("catalog")}>
              <span className="block w-5 h-0.5 bg-foreground rounded-full" />
              <span className="block w-5 h-0.5 bg-foreground rounded-full" />
              <span className="block w-5 h-0.5 bg-foreground rounded-full" />
            </button>

            {/* ── Search с автокомплитом ── */}
            <div ref={searchRef} className="flex-1 min-w-0 relative">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (debouncedQuery.trim().length >= 2) setShowDropdown(true); }}
                    className="w-full h-9 sm:h-10 pl-3 pr-8 text-sm rounded-l-lg border border-r-0 border-border outline-none bg-background text-foreground placeholder:text-muted-foreground focus:border-[#C0392B]"
                  />
                  {searchQuery && (
                    <button type="button" onClick={clearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button type="submit"
                  className="h-9 sm:h-10 px-3 sm:px-4 rounded-r-lg text-white flex items-center gap-1.5 text-sm font-medium shrink-0"
                  style={{ backgroundColor: "#C0392B" }}>
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("search")}</span>
                </button>
              </form>

              {/* ── Dropdown автокомплит ── */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  {sugFetching && suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">...</div>
                  ) : suggestions.length > 0 ? (
                    <>
                      {suggestions.map((p) => (
                        <button key={p.id} onMouseDown={() => handleSuggestionClick(p)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                          {p.image && (
                            <img src={p.image} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0 border border-border" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">{getTitle(p)}</p>
                            <p className="text-xs text-muted-foreground">{p.category} · {(p.price || 0).toLocaleString("ru-RU")} ₸</p>
                          </div>
                        </button>
                      ))}
                      {/* Ссылка "Показать все результаты" */}
                      <button onMouseDown={handleSearch}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold hover:bg-secondary transition-colors"
                        style={{ color: "#C0392B" }}>
                        <Search className="h-3.5 w-3.5" />
                        {t("search")} «{searchQuery}»
                      </button>
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">{t("noProducts")}</div>
                  )}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors shrink-0 text-foreground"
              title={theme === "dark" ? t("lightTheme") : t("darkTheme")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Lang dropdown (desktop) */}
            <div ref={langRef} className="hidden sm:block relative">
              <button onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1 px-2 h-9 rounded-lg hover:bg-secondary transition-colors text-xs font-bold uppercase text-foreground">
                {LANG_CONFIG.find(l => l.code === lang)?.flag} {lang}
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
                  {LANG_CONFIG.map(({ code, label, flag, name }) => (
                    <button key={code} onClick={() => { setLang(code); setLangOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-secondary transition-colors
                        ${lang === code ? "font-bold text-[#C0392B] bg-secondary/50" : "text-foreground"}`}>
                      <span className="text-base">{flag}</span>
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs text-muted-foreground">{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop icons */}
            <div className="hidden sm:flex items-center gap-3">
              <IconBtn to="/my-orders" icon={Package}      label={t("myOrders")} badge={0} />
              <IconBtn to="/favorites" icon={Heart}        label={t("favorites")} badge={favCount} />
              <IconBtn to="/cart"      icon={ShoppingCart} label={t("cart")}     badge={cartCount} />
              {user ? (
                <IconBtn to="/profile"  icon={User}   label={user.name?.split(" ")[0] || t("cabinet")} badge={0} />
              ) : (
                <IconBtn to="/login"    icon={User}   label="Войти" badge={0} />
              )}
            </div>

            {/* Mobile cart only */}
            <div className="flex sm:hidden items-center gap-2">
              <Link to="/cart" className="relative p-2 text-foreground hover:text-[#C0392B] transition-colors">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[9px] border-0" style={{ backgroundColor: "#C0392B" }}>
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card border-t border-border">
        <div className="flex items-stretch">
          {[
            { to: "/catalog",   icon: Grid3X3, labelKey: "catalog" },
            { to: "/favorites", icon: Heart,   labelKey: "favorites", badge: favCount },
            { to: "/my-orders", icon: Package, labelKey: "myOrders" },
            user
              ? { to: "/profile",  icon: User, labelKey: "cabinet" }
              : { to: "/login",    icon: User, labelKey: "cabinet" },
          ].map(({ to, icon: Icon, labelKey, badge }) => {
            const active = location.pathname === to;
            return (
              <Link key={labelKey} to={to}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${active ? "text-[#C0392B]" : "text-muted-foreground"}`}>
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badge > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center p-0 text-[9px] border-0 leading-none" style={{ backgroundColor: "#C0392B" }}>
                      {badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
