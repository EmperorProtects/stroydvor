import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";

// Дефолтные данные с тройной локализацией
const DEFAULT_SLIDES = [
//   { id: 1,
//     title_ru: "Кровельные материалы\nсо скидкой до 30%", title_kz: "Шатыр материалдары\n30%-ға дейін жеңілдік", title_en: "Roofing Materials\nUp to 30% Off",
//     subtitle_ru: "металлочерепица, профнастил, водосток", subtitle_kz: "металл черепица, профнастил, су ағызу", subtitle_en: "metal tiles, corrugated sheets, gutters",
//     cta_text_ru: "Смотреть акции", cta_text_kz: "Акцияларды қарау", cta_text_en: "See offers",
//     cta_link: "/catalog/Кровля", image_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80", bg_color: "#1a3a2a", text_color: "#ffffff" },
//   { id: 2,
//     title_ru: "Утеплители и изоляция\nдля тёплого дома", title_kz: "Жылы үй үшін\nжылу оқшаулау", title_en: "Insulation Materials\nFor a Warm Home",
//     subtitle_ru: "минвата, пенопласт, пароизоляция", subtitle_kz: "минвата, пенопласт, бу оқшаулау", subtitle_en: "mineral wool, foam, vapour barrier",
//     cta_text_ru: "Выбрать", cta_text_kz: "Таңдау", cta_text_en: "Choose",
//     cta_link: "/catalog/Изоляция", image_url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1400&q=80", bg_color: "#1a1a3a", text_color: "#ffffff" },
//   { id: 3,
//     title_ru: "Инструменты Bosch,\nMakita, DeWalt", title_kz: "Bosch, Makita, DeWalt\nаспаптары", title_en: "Bosch, Makita,\nDeWalt Tools",
//     subtitle_ru: "большой выбор электроинструмента", subtitle_kz: "электр аспаптарының кең таңдауы", subtitle_en: "wide selection of power tools",
//     cta_text_ru: "В каталог", cta_text_kz: "Каталогқа", cta_text_en: "To catalog",
//     cta_link: "/catalog/Инструменты", image_url: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1400&q=80", bg_color: "#2a1a1a", text_color: "#ffffff" },
];
//
const DEFAULT_PROMO = [
//   { id: 1,
//     title_ru: "Скидки на\nкровлю до 30%", title_kz: "Шатырға\n30% жеңілдік", title_en: "Roofing Sale\nUp to 30%",
//     badge_text_ru: "−30%", badge_text_kz: "−30%", badge_text_en: "−30%",
//     cta_link: "/catalog/Кровля", image_url: "https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400&q=80", bg_color: "#C0392B", text_color: "#fff" },
//   { id: 2,
//     title_ru: "Акция\nмесяца", title_kz: "Ай\nакциясы", title_en: "Monthly\nDeal",
//     badge_text_ru: "−20%", badge_text_kz: "−20%", badge_text_en: "−20%",
//     cta_link: "/catalog", image_url: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400&q=80", bg_color: "#f5f5f5", text_color: "#1A1A1A" },
//   { id: 3,
//     title_ru: "Утеплители\nи изоляция", title_kz: "Жылу\nоқшаулау", title_en: "Insulation\n& Warmth",
//     badge_text_ru: "", badge_text_kz: "", badge_text_en: "",
//     cta_link: "/catalog/Изоляция", image_url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80", bg_color: "#f0f4ff", text_color: "#1A1A1A" },
//   { id: 4,
//     title_ru: "Сухие смеси\nоптом", title_kz: "Құрғақ қоспалар\nкөтерме", title_en: "Dry Mixes\nWholesale",
//     badge_text_ru: "", badge_text_kz: "", badge_text_en: "",
//     cta_link: "/catalog/Сухие смеси", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", bg_color: "#fff8f0", text_color: "#1A1A1A" },
];
//
/** Получить локализованное поле баннера */
function bf(banner, field, lang) {
  return banner[`${field}_${lang}`] || banner[`${field}_ru`] || banner[field] || "";
}

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const { lang } = useApp();

  const { data: allBanners = [] } = useQuery({
    queryKey: ["promoBanners", lang],
    queryFn: () => base44.entities.PromoBanner.list("sort_order"),
  });

  const activeBanners = allBanners.filter(b => b.is_active !== false);
  const slides = activeBanners.filter(b => b.type === "slider").length > 0
    ? activeBanners.filter(b => b.type === "slider")
    : DEFAULT_SLIDES;
  const promoCards = activeBanners.filter(b => b.type === "promo_card").length > 0
    ? activeBanners.filter(b => b.type === "promo_card")
    : DEFAULT_PROMO;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent(c => (c + 1) % slides.length);

  const slide = slides[current] || slides[0];
  if (!slide) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-0 sm:pt-4 pb-2">
      {/* ── Главный слайдер ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl" style={{ height: "clamp(160px, 28vw, 300px)" }}>
        <AnimatePresence mode="wait">
          <motion.div key={slide.id} className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {slide.image_url && <img src={slide.image_url} alt="" className="w-full h-full object-cover" />}
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(to right, ${slide.bg_color}ee 40%, ${slide.bg_color}55 75%, transparent 100%)` }} />
          </motion.div>
        </AnimatePresence>

        <div className="relative h-full flex items-center px-4 sm:px-8 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div key={slide.id + "-text" + lang}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }} className="max-w-[55%] sm:max-w-none">
              <h2 className="font-bold leading-tight mb-1 sm:mb-2"
                style={{ fontSize: "clamp(14px, 3.5vw, 36px)", color: slide.text_color || "#ffffff" }}>
                {bf(slide, "title", lang).split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
              </h2>
              {bf(slide, "subtitle", lang) && (
                <p className="hidden sm:block text-sm md:text-base mb-4"
                  style={{ color: `${slide.text_color || "#ffffff"}bb` }}>
                  {bf(slide, "subtitle", lang)}
                </p>
              )}
              {bf(slide, "cta_text", lang) && (
                <Link to={slide.cta_link || "/catalog"}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-opacity hover:opacity-90 mt-1 sm:mt-0"
                  style={{ backgroundColor: "#C0392B" }}>
                  {bf(slide, "cta_text", lang)} →
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {slides.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white backdrop-blur-sm transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white backdrop-blur-sm transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className="h-1.5 rounded-full transition-all"
                style={{ width: i === current ? "20px" : "6px", backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.45)" }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Promo-карточки ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-4 sm:gap-3">
        {promoCards.map((card) => {
          const title    = bf(card, "title", lang);
          const badge    = bf(card, "badge_text", lang);
          return (
            <Link key={card.id} to={card.cta_link || "/catalog"}
              className="relative rounded-xl overflow-hidden flex flex-col justify-start"
              style={{ height: "clamp(110px, 30vw, 180px)", backgroundColor: card.bg_color || "#f5f5f5" }}>
              {badge && (
                <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white z-10"
                  style={{ backgroundColor: "#C0392B" }}>{badge}</span>
              )}
              <p className="font-bold text-xs sm:text-sm leading-snug p-3 z-10 relative"
                style={{ color: card.text_color || "#1A1A1A" }}>
                {title.split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
              </p>
              {card.image_url && (
                <img src={card.image_url} alt=""
                  className="absolute bottom-0 right-0 h-3/4 w-1/2 object-cover rounded-tl-xl opacity-85" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
