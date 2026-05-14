import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

// ─── Debounce hook ─────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Default categories ────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { name:"Кровля",        name_ru:"Кровля",        name_kz:"Шатыр материалдары", name_en:"Roofing",
    image_url:"https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400&q=80",
    subs_ru:["Металлочерепица","Профнастил","Мягкая кровля","Водосточные системы"],
    subs_kz:["Металл черепица","Профнастил","Жұмсақ шатыр","Су ағызу жүйелері"],
    subs_en:["Metal Tiles","Corrugated Sheets","Soft Roofing","Gutter Systems"] },
  { name:"Фасады",        name_ru:"Фасады",        name_kz:"Қасбет материалдары", name_en:"Facades",
    image_url:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    subs_ru:["Сайдинг виниловый","Сайдинг металлический","Фасадные панели"],
    subs_kz:["Винил сайдинг","Металл сайдинг","Қасбет панельдер"],
    subs_en:["Vinyl Siding","Metal Siding","Facade Panels"] },
  { name:"Изоляция",      name_ru:"Изоляция",      name_kz:"Жылу оқшаулау",      name_en:"Insulation",
    image_url:"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80",
    subs_ru:["Минеральная вата","Пенопласт","ЭППС","Пароизоляция"],
    subs_kz:["Минералды мақта","Пенопласт","ЭППС","Бу оқшаулау"],
    subs_en:["Mineral Wool","Styrofoam","XPS","Vapour Barrier"] },
  { name:"Пиломатериалы", name_ru:"Пиломатериалы", name_kz:"Ағаш материалдар",   name_en:"Lumber",
    image_url:"https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400&q=80",
    subs_ru:["Доска обрезная","Брус строительный","Фанера","OSB плиты"],
    subs_kz:["Кесілген тақта","Брус","Фанера","OSB"],
    subs_en:["Sawn Board","Timber","Plywood","OSB"] },
  { name:"Инструменты",   name_ru:"Инструменты",   name_kz:"Құралдар",           name_en:"Tools",
    image_url:"https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80",
    subs_ru:["Электроинструмент","Ручной инструмент","Перфораторы"],
    subs_kz:["Электр аспаптар","Қол аспаптар","Перфораторлар"],
    subs_en:["Power Tools","Hand Tools","Rotary Hammers"] },
  { name:"Крепёж",        name_ru:"Крепёж",        name_kz:"Бекіткіштер",        name_en:"Fasteners",
    image_url:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    subs_ru:["Саморезы","Анкеры","Дюбели"],
    subs_kz:["Бұрандалар","Якорлар","Дюбельдер"],
    subs_en:["Screws","Anchors","Dowels"] },
  { name:"Сухие смеси",   name_ru:"Сухие смеси",   name_kz:"Құрғақ қоспалар",   name_en:"Dry Mixes",
    image_url:"https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80",
    subs_ru:["Цемент","Штукатурка","Шпаклёвка","Плиточный клей"],
    subs_kz:["Цемент","Сылақ","Шпаклёвка","Тақта желімі"],
    subs_en:["Cement","Plaster","Filler","Tile Adhesive"] },
  { name:"Сантехника",    name_ru:"Сантехника",    name_kz:"Сантехника",         name_en:"Plumbing",
    image_url:"https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=400&q=80",
    subs_ru:["Трубы и фитинги","Смесители","Водонагреватели"],
    subs_kz:["Құбырлар","Крандар","Су жылытқыштар"],
    subs_en:["Pipes & Fittings","Mixers","Water Heaters"] },
];

// ─── Highlight matched text ────────────────────────────────────────────────
function Highlight({ text = "", query = "" }) {
  if (!query || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5 not-italic">{p}</mark>
          : p
      )}
    </>
  );
}

// ─── Search results page ───────────────────────────────────────────────────
function SearchResults({ query, lang, t, tField }) {
  const debouncedQuery = useDebounce(query, 350);

  const { data: products = [], isFetching } = useQuery({
    queryKey: ["searchResults", debouncedQuery, lang],
    queryFn: () => base44.entities.Product.filter({ search: debouncedQuery }, "-created_date", 60, lang),
    enabled: debouncedQuery.length >= 2,
    staleTime: 3 * 60 * 1000,
  });

  if (debouncedQuery.length < 2) return (
    <div className="text-center py-16 text-muted-foreground text-sm">
      {t("searchPlaceholder")}
    </div>
  );

  if (isFetching && products.length === 0) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-56 bg-secondary rounded-lg animate-pulse" />
      ))}
    </div>
  );

  if (products.length === 0) return (
    <div className="text-center py-16">
      <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-muted-foreground">{t("noProducts")}</p>
      <p className="text-sm text-muted-foreground/60 mt-1">«{query}»</p>
    </div>
  );

  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground mb-4">
        {t("search")}: <span className="font-medium text-foreground">«{query}»</span>
        {" — "}{products.length} {t("products")}
        {isFetching && <span className="ml-2 opacity-50">...</span>}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

// ─── CatalogCard ───────────────────────────────────────────────────────────
function CatalogCard({ cat, dbSubs }) {
  const { tField, lang, t } = useApp();
  const catName = tField(cat, "name");
  const subs = dbSubs.length > 0
    ? dbSubs.map(s => tField(s, "name"))
    : (cat[`subs_${lang}`] || cat.subs_ru || []);

  return (
    <Link to={`/catalog/${encodeURIComponent(cat.name)}`}
      className="flex flex-col items-start group p-4 hover:bg-gray-800 rounded-lg transition-colors">
      <div className="w-16 h-16 overflow-hidden rounded-lg bg-gray-100 mb-3 shrink-0">
        {cat.image_url ? (
          <img src={cat.image_url} alt={catName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>
      <p className="group-hover:text-[#C0392B] transition-colors mb-2 font-semibold"
        style={{ fontSize: "21px", letterSpacing: "0.2px", lineHeight: "26px" }}>
        {catName}
      </p>
      <div className="flex flex-col gap-0.5">
        {subs.slice(0, 5).map((sub) => (
          <span key={sub} className="hover:text-[#C0392B] transition-colors"
            style={{ fontSize: "17px", fontWeight: 400, lineHeight: "22px" }}>
            {sub}
          </span>
        ))}
        {subs.length > 5 && (
          <span className="text-sm mt-1">{t("showMore")} {subs.length - 5}...</span>
        )}
      </div>
    </Link>
  );
}

// ─── Main Catalog / Products page ─────────────────────────────────────────
export default function Products() {
  const { tField, lang, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Читаем ?search= или ?q= из URL
  const urlQuery = searchParams.get("search") || searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const inputRef = useRef(null);

  // Синхронизируем локальный стейт с URL (при переходе по ссылке из Header)
  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q") || "";
    setLocalQuery(q);
  }, [searchParams]);

  const isSearching = localQuery.trim().length >= 2;

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories", lang],
    queryFn: () => base44.entities.Category.list(lang),
  });

  const activeDb = dbCategories.filter(c => c.is_active !== false);
  const dbTopLevel = activeDb.filter(c => !c.parent_category);
  const getDbSubs = (parentName) => activeDb.filter(c => c.parent_category === parentName);
  const categories = dbTopLevel.length > 0 ? dbTopLevel : DEFAULT_CATEGORIES;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = localQuery.trim();
    if (q) setSearchParams({ search: q }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const clearSearch = () => {
    setLocalQuery("");
    setSearchParams({}, { replace: true });
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Поисковая строка ── */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={e => {
                setLocalQuery(e.target.value);
                // live update URL при вводе (с небольшой задержкой через debounce)
                const q = e.target.value.trim();
                if (q.length >= 2) setSearchParams({ search: q }, { replace: true });
                else if (!q) setSearchParams({}, { replace: true });
              }}
              placeholder={t("searchPlaceholder")}
              className="w-full h-10 pl-9 pr-10 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B]"
            />
            {localQuery && (
              <button type="button" onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button type="submit"
            className="h-10 px-5 rounded-lg text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: "#C0392B" }}>
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{t("search")}</span>
          </button>
        </form>

        {/* ── Результаты поиска или сетка категорий ── */}
        {isSearching ? (
          <SearchResults
            query={localQuery.trim()}
            lang={lang}
            t={t}
            tField={tField}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4">
            {categories.map((cat) => (
              <CatalogCard key={cat.name} cat={cat} dbSubs={getDbSubs(cat.name)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
