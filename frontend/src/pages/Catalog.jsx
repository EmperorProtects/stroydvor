import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useApp } from "@/lib/AppContext";

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

function CatalogCard({ cat, dbSubs }) {
  const { tField, lang, t } = useApp();
  const catName = tField(cat, "name");
  // const catName = cat.name

  // Подкатегории: если из БД — используем tField, если defaults — берём subs_ru/kz/en
  const subs = dbSubs.length > 0
    ? dbSubs.map(s => tField(s, "name"))
    : (cat[`subs_${lang}`] || cat.subs_ru || []);
  console.log("CatalogCard", catName, "subs:", subs);

  // const subs = dbSubs.length > 0 
  //   ? ""
  //   : obj[]
  //   // return obj[`${field}_${lang}`] || obj[`${field}_ru`] || obj[field] || "";
  // // const subs = dbSubs.length >0 ? dbSubs.map(s => tField(s, "name"))  : (cat[`subs_${lang}`] || cat.subs_ru || []);

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

export default function Catalog() {

  const { tField, lang, t } = useApp();
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories", lang],
    queryFn: () => base44.entities.Category.list("ru"),
  });

  const activeDb = dbCategories.filter(c => c.is_active !== false);
  const dbTopLevel = activeDb.filter(c => !c.parent_category);
  const getDbSubs = (parentName) => activeDb.filter(c => c.parent_category === parentName);

  const categories = dbTopLevel.length > 0 ? dbTopLevel : DEFAULT_CATEGORIES;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {categories.map((cat) => (
            <CatalogCard key={cat.name} cat={cat} dbSubs={getDbSubs(cat.name)} />
          ))}
        </div>
      </div>
    </div>
  );
}
