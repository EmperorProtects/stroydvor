import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Helmet } from "react-helmet";
import { useApp } from "@/lib/AppContext";

const CARD_COLORS = ["#f5f5f5","#f0f4ff","#f5fff5","#fff8f0","#fdf5ff","#f0fafa"];

function SubcategoryGrid({ subcategories, parentName }) {
  const { tField } = useApp();
  if (!subcategories.length) return null;
  const rows = [];
  let i = 0, rowIndex = 0;
  while (i < subcategories.length) {
    const cols = rowIndex < 2 ? 3 : 5;
    rows.push({ items: subcategories.slice(i, i + cols), cols });
    i += cols; rowIndex++;
  }
  return (
    <div className="space-y-3">
      {rows.map((row, ri) => (
        <div key={ri} className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${row.cols}, minmax(0, 1fr))` }}>
          {row.items.map((sub, si) => (
            <Link key={sub.name}
              to={`/catalog/${encodeURIComponent(parentName)}/${encodeURIComponent(sub.name)}`}
              className="flex flex-col items-center rounded-lg overflow-hidden group hover:shadow-md transition-shadow"
              style={{ backgroundColor: CARD_COLORS[(ri * 10 + si) % CARD_COLORS.length] }}>
              <div className="w-full flex items-center justify-center overflow-hidden"
                style={{ height: "clamp(80px, 12vw, 160px)" }}>
                {sub.image_url
                  ? <img src={sub.image_url} alt={tField(sub, "name")}
                      className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      style={{ mixBlendMode: "multiply" }} />
                  : <span className="text-4xl">{sub.icon || "📦"}</span>}
              </div>
              <div className="w-full px-2 py-2 bg-white">
                <p className="text-center text-xs sm:text-sm text-gray-700 leading-snug font-medium">
                  {tField(sub, "name")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

function SubcategoryList({ subcategories, parentName }) {
  const { tField } = useApp();
  if (!subcategories.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {subcategories.map((sub, si) => (
        <Link key={sub.name}
          to={`/catalog/${encodeURIComponent(parentName)}/${encodeURIComponent(sub.name)}`}
          className="flex items-center gap-3 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
          style={{ backgroundColor: CARD_COLORS[si % CARD_COLORS.length] }}>
          <div className="flex items-center justify-center shrink-0" style={{ width: 64, height: 64 }}>
            {sub.image_url
              ? <img src={sub.image_url} alt={tField(sub, "name")}
                  className="w-full h-full object-contain p-2" style={{ mixBlendMode: "multiply" }} />
              : <span className="text-2xl">{sub.icon || "📦"}</span>}
          </div>
          <p className="text-sm font-medium text-gray-800 flex-1 pr-2 leading-snug">{tField(sub, "name")}</p>
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mr-3" />
        </Link>
      ))}
    </div>
  );
}

function ProductCatalog({ categoryName, subcategories, allCategories }) {
  const { t, tField, lang } = useApp();
  const [selectedSub, setSelectedSub] = useState(null);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(999999);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categoryName, lang],
    queryFn: () => base44.entities.Product.filter({ category: categoryName }, "-created_date", 500, lang),
  });

  const relatedCategories = useMemo(() => {
    const cats = new Set([categoryName]);
    subcategories.forEach(s => cats.add(s.name));
    allCategories.forEach(c => { if (c.parent_category === categoryName) cats.add(c.name); });
    return Array.from(cats);
  }, [categoryName, subcategories, allCategories]);

  const filtered = useMemo(() => products.filter(p => {
    if (!relatedCategories.includes(p.category) && !relatedCategories.includes(p.subcategory)) return false;
    if (selectedSub && p.subcategory !== selectedSub && p.category !== selectedSub) return false;
    if (p.price < priceMin || p.price > priceMax) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    return true;
  }), [products, relatedCategories, selectedSub, priceMin, priceMax, selectedBrand]);

  const brands = useMemo(() => {
    const s = new Set();
    products.forEach(p => { if (p.brand) s.add(p.brand); });
    return Array.from(s).sort();
  }, [products]);

  const hasActiveFilters = selectedSub || selectedBrand || priceMin > 0 || priceMax < 999999;
  const resetFilters = () => { setSelectedSub(null); setSelectedBrand(null); setPriceMin(0); setPriceMax(999999); };

  if (isLoading) return (
    <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => <div key={i} className="h-56 bg-secondary rounded-lg animate-pulse" />)}
    </div>
  );

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">{t("products")}</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} {t("products")}</p>
          </div>
          <button onClick={() => setShowMobileFilters(v => !v)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" /> {t("filterTitle")}
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#C0392B]" />}
          </button>
        </div>

        {/* Desktop filters */}
        <div className="hidden sm:flex flex-wrap gap-2 items-center">
          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center border-r border-border pr-3 mr-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">{t("subcategories")}:</span>
              <button onClick={() => setSelectedSub(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!selectedSub ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {t("all")}
              </button>
              {subcategories.map(sub => (
                <button key={sub.name} onClick={() => setSelectedSub(sub.name === selectedSub ? null : sub.name)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${selectedSub === sub.name ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {tField(sub, "name")}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t("priceFrom")}:</span>
            <input type="number" value={priceMin || ""} onChange={e => setPriceMin(Number(e.target.value) || 0)}
              placeholder={t("priceFrom")} className="w-20 h-7 border border-border rounded px-2 text-xs bg-background" />
            <span className="text-xs text-muted-foreground">—</span>
            <input type="number" value={priceMax === 999999 ? "" : priceMax}
              onChange={e => setPriceMax(Number(e.target.value) || 999999)}
              placeholder={t("priceTo")} className="w-24 h-7 border border-border rounded px-2 text-xs bg-background" />
            <span className="text-xs text-muted-foreground">₸</span>
          </div>
          {brands.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-muted-foreground font-medium">{t("brand")}:</span>
              <select value={selectedBrand || ""} onChange={e => setSelectedBrand(e.target.value || null)}
                className="h-7 border border-border rounded px-2 text-xs bg-background">
                <option value="">{t("all")}</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="ml-1 text-xs text-[#C0392B] hover:underline">{t("reset")}</button>
          )}
        </div>

        {/* Mobile filters */}
        {showMobileFilters && (
          <div className="sm:hidden mt-3 p-4 bg-card border border-border rounded-xl space-y-4">
            {subcategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">{t("subcategories")}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSelectedSub(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${!selectedSub ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground"}`}>
                    {t("all")}
                  </button>
                  {subcategories.map(sub => (
                    <button key={sub.name} onClick={() => setSelectedSub(sub.name === selectedSub ? null : sub.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedSub === sub.name ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground"}`}>
                      {tField(sub, "name")}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold mb-2">{t("priceFrom")} (₸)</p>
              <div className="flex gap-2">
                <input type="number" value={priceMin || ""} onChange={e => setPriceMin(Number(e.target.value) || 0)}
                  placeholder={t("priceFrom")} className="flex-1 h-8 border border-border rounded px-2 text-sm bg-background" />
                <input type="number" value={priceMax === 999999 ? "" : priceMax}
                  onChange={e => setPriceMax(Number(e.target.value) || 999999)}
                  placeholder={t("priceTo")} className="flex-1 h-8 border border-border rounded px-2 text-sm bg-background" />
              </div>
            </div>
            {brands.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">{t("brand")}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSelectedBrand(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${!selectedBrand ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground"}`}>
                    {t("all")}
                  </button>
                  {brands.map(b => (
                    <button key={b} onClick={() => setSelectedBrand(b === selectedBrand ? null : b)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedBrand === b ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground"}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {hasActiveFilters && (
              <button onClick={() => { resetFilters(); setShowMobileFilters(false); }}
                className="w-full text-sm text-[#C0392B] font-medium py-1">
                {t("reset")}
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">{t("noProducts")}</p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="mt-2 text-sm text-[#C0392B] hover:underline">{t("reset")}</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  const { category, subcategory } = useParams();
  const { t, tField, lang } = useApp();
  const categoryName    = decodeURIComponent(category);
  const subcategoryName = subcategory ? decodeURIComponent(subcategory) : null;

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories", lang],
    queryFn: () => base44.entities.Category.list(lang),
  });

  const active = allCategories.filter(c => c.is_active !== false);
  const currentCatDb = active.find(c => c.name === (subcategoryName || categoryName));
  const parentCategory = subcategoryName ? categoryName : null;
  const displayName    = subcategoryName || categoryName;

  // Локализованное имя категории
  const displayNameLocalized = currentCatDb ? tField(currentCatDb, "name") : displayName;

  const subcategories = active
    .filter(c => c.parent_category === displayName)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // SEO с учётом языка
  const seoTitle = (currentCatDb && tField(currentCatDb, "seo_title"))
    || `${displayNameLocalized} — Строй-Двор`;
  const seoDesc  = (currentCatDb && tField(currentCatDb, "seo_description"))
    || `${displayNameLocalized} — широкий выбор в Строй-Двор.`;
  const seoKeys  = (currentCatDb && tField(currentCatDb, "keywords"))
    || displayNameLocalized;

  return (
    <div className="bg-background min-h-screen pb-24 sm:pb-0">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <meta name="keywords"    content={seoKeys} />
        <html lang={lang === "kz" ? "kk" : lang} />
        <link rel="canonical"
          href={`https://stroydvor.kz/catalog/${encodeURIComponent(categoryName)}${subcategoryName ? `/${encodeURIComponent(subcategoryName)}` : ""}`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-4 overflow-x-auto">
          <Link to="/"        className="hover:text-foreground transition-colors whitespace-nowrap">{t("home")}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/catalog" className="hover:text-foreground transition-colors whitespace-nowrap">{t("catalog")}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {parentCategory && (() => {
            const parentDb = active.find(c => c.name === parentCategory);
            return (
              <>
                <Link to={`/catalog/${encodeURIComponent(parentCategory)}`}
                  className="hover:text-foreground transition-colors whitespace-nowrap">
                  {parentDb ? tField(parentDb, "name") : parentCategory}
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </>
            );
          })()}
          <span className="text-foreground font-medium whitespace-nowrap">{displayNameLocalized}</span>
        </nav>

        {/* Заголовок */}
        <div className="mb-5 sm:mb-7">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {displayNameLocalized}
          </h1>
          {currentCatDb && tField(currentCatDb, "seo_description") && (
            <p className="text-xs text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {tField(currentCatDb, "seo_description")}
            </p>
          )}
        </div>

        {/* Подкатегории — десктоп */}
        {subcategories.length > 0 && (
          <div className="hidden sm:block mb-8">
            <SubcategoryGrid subcategories={subcategories} parentName={displayName} />
          </div>
        )}

        {/* Подкатегории — мобильный */}
        {subcategories.length > 0 && (
          <div className="sm:hidden mb-6">
            <SubcategoryList subcategories={subcategories} parentName={displayName} />
          </div>
        )}

        <ProductCatalog
          categoryName={subcategoryName || categoryName}
          subcategories={subcategories}
          allCategories={active}
        />
      </div>
    </div>
  );
}
