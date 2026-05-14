import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";

const DEFAULT_CATEGORIES = [
  { name: "Кровля",       name_ru: "Кровля",       name_kz: "Шатыр материалдары", name_en: "Roofing",       image: "https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400&q=80" },
  { name: "Фасады",       name_ru: "Фасады",       name_kz: "Қасбет материалдары", name_en: "Facades",      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { name: "Изоляция",     name_ru: "Изоляция",     name_kz: "Жылу оқшаулау",      name_en: "Insulation",   image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80" },
  { name: "Пиломатериалы",name_ru: "Пиломатериалы",name_kz: "Ағаш материалдар",   name_en: "Lumber",       image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400&q=80" },
  { name: "Инструменты",  name_ru: "Инструменты",  name_kz: "Құралдар",           name_en: "Tools",        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80" },
  { name: "Крепёж",       name_ru: "Крепёж",       name_kz: "Бекіткіштер",        name_en: "Fasteners",    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
  { name: "Сухие смеси",  name_ru: "Сухие смеси",  name_kz: "Құрғақ қоспалар",   name_en: "Dry Mixes",    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80" },
  { name: "Сантехника",   name_ru: "Сантехника",   name_kz: "Сантехника",         name_en: "Plumbing",     image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=400&q=80" },
];

function CategoryCard({ cat, subcategories }) {
  const [showAll, setShowAll] = useState(false);
  const { t, tField, lang } = useApp();
  const VISIBLE_LIMIT = 5;
  const hasMore = subcategories.length > VISIBLE_LIMIT;
  const shown = showAll ? subcategories : subcategories.slice(0, VISIBLE_LIMIT);

  const catName = tField(cat, "name");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <Link to={`/catalog/${encodeURIComponent(cat.name)}`} className="block relative h-36 overflow-hidden group">
        <img src={cat.image || cat.image_url} alt={catName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-3 left-3 text-white font-bold text-base">{catName}</h3>
      </Link>

      {subcategories.length > 0 && (
        <div className="p-3">
          <div className="flex flex-col gap-0.5">
            {shown.map((sub) => (
              <Link key={sub.id || sub.name}
                to={`/catalog/${encodeURIComponent(cat.name)}/${encodeURIComponent(sub.name)}`}
                className="text-xs text-muted-foreground hover:text-primary hover:translate-x-0.5 transition-all py-0.5 truncate">
                → {tField(sub, "name")}
              </Link>
            ))}
          </div>
          {hasMore && (
            <button onClick={(e) => { e.preventDefault(); setShowAll(!showAll); }}
              className="flex items-center gap-1 text-xs font-medium mt-2 transition-colors"
              style={{ color: "#C0392B" }}>
              {showAll
                ? <><ChevronUp className="h-3 w-3" /> {t("collapse")}</>
                : <><ChevronDown className="h-3 w-3" /> {t("showMore")} {subcategories.length - VISIBLE_LIMIT}</>}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function CategoriesSection() {
  const { t, tField, lang } = useApp();

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories", lang],
    queryFn: () => base44.entities.Category.list("ru"),
  });
  console.log("Fetched categories from DB:", dbCategories);

  const activeCategories = dbCategories.filter(c => c.is_active);
  console.log("Active categories:", activeCategories);
  const topLevel = activeCategories.filter(c => !c.parent_category);
  const displayCats = topLevel.length > 0
    ? topLevel
    : DEFAULT_CATEGORIES.map((d, i) => ({ ...d, id: d.name, sort_order: i }));

  const getSubcategories = (parentName) => activeCategories.filter(c => c.parent_category === parentName);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("categoriesTitle")}</h2>
        <Link to="/catalog" className="text-sm font-medium hover:underline" style={{ color: "#C0392B" }}>
          {t("allCategories")}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {displayCats.map((cat) => (
          <CategoryCard key={cat.id || cat.name} cat={cat} subcategories={getSubcategories(cat.name)} />
        ))}
      </div>
    </section>
  );
}
