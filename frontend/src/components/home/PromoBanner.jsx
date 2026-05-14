import { Link } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";

// Дефолтные данные с тройной локализацией
const DEFAULT_TOP = {
  title_ru: "Кровельные материалы\nсо скидкой до 30%",
  title_kz: "Шатыр материалдары\n30%-ға дейін жеңілдік",
  title_en: "Roofing Materials\nUp to 30% Off",
  subtitle_ru: "Металлочерепица, профнастил, мягкая кровля — всё для надёжной крыши. Успейте до конца месяца.",
  subtitle_kz: "Металл черепица, профнастил, жұмсақ шатыр — сенімді шатыр үшін барлығы. Ай аяғына дейін үлгеріңіз.",
  subtitle_en: "Metal tiles, corrugated sheets, soft roofing — everything for a reliable roof. Limited time offer.",
  cta_text_ru: "Смотреть товары", cta_text_kz: "Тауарларды қарау", cta_text_en: "View Products",
  badge_text_ru: "Акция месяца", badge_text_kz: "Ай акциясы", badge_text_en: "Monthly Deal",
  price_label_ru: "Металлочерепица от", price_label_kz: "Металл черепица бастап", price_label_en: "Metal tiles from",
  price_value: "1 490 ₸", price_unit: "м²",
  cta_link: "/catalog/Кровля",
  bg_color: "#1A1A1A", text_color: "#ffffff",
};

const DEFAULT_BOTTOM = [
  {
    title_ru: "Сухие смеси и цемент",   title_kz: "Құрғақ қоспалар және цемент", title_en: "Dry Mixes & Cement",
    subtitle_ru: "Оптовые цены при покупке от 50 мешков", subtitle_kz: "50 қаптамадан сатып алғанда көтерме бағалар", subtitle_en: "Wholesale prices when buying 50+ bags",
    badge_text_ru: "Специальное предложение", badge_text_kz: "Арнайы ұсыныс", badge_text_en: "Special offer",
    cta_text_ru: "Подробнее", cta_text_kz: "Толығырақ", cta_text_en: "Learn more",
    cta_link: "/catalog/Сухие смеси", bg_color: "#C0392B", text_color: "#ffffff",
  },
  {
    title_ru: "Инструменты Bosch и Makita", title_kz: "Bosch және Makita аспаптары", title_en: "Bosch & Makita Tools",
    subtitle_ru: "Профессиональный инструмент с гарантией производителя", subtitle_kz: "Өндіруші кепілдігі бар кәсіби аспаптар", subtitle_en: "Professional tools with manufacturer warranty",
    badge_text_ru: "Новинки", badge_text_kz: "Жаңалықтар", badge_text_en: "New arrivals",
    cta_text_ru: "В каталог", cta_text_kz: "Каталогқа", cta_text_en: "View catalog",
    cta_link: "/catalog/Инструменты", bg_color: "#1A1A1A", text_color: "#ffffff",
  },
];

/** Получить локализованное поле баннера */
function bf(banner, field, lang) {
  return banner[`${field}_${lang}`] || banner[`${field}_ru`] || banner[field] || "";
}

export default function PromoBanner({ variant = "top" }) {
  const { lang } = useApp();

  const { data: allBanners = [] } = useQuery({
    queryKey: ["promoBanners", lang],
    queryFn: () => base44.entities.PromoBanner.list("sort_order"),
    staleTime: 60000,
  });

  const activeBanners = allBanners.filter(b => b.is_active !== false);

  if (variant === "top") {
    const dbTop = activeBanners.filter(b => b.type === "promo_top")[0];
    const data = dbTop || DEFAULT_TOP;

    const title      = bf(data, "title", lang);
    const subtitle   = bf(data, "subtitle", lang);
    const ctaText    = bf(data, "cta_text", lang);
    const badgeText  = bf(data, "badge_text", lang);
    const priceLabel = bf(data, "price_label", lang);

    return (
      <section className="py-3 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-8"
            style={{ backgroundColor: data.bg_color || "#1A1A1A" }}>
            {/* Декоративные круги */}
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10"
              style={{ backgroundColor: "#C0392B", transform: "translate(30%, -40%)" }} />
            <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full opacity-10"
              style={{ backgroundColor: "#C0392B", transform: "translateY(40%)" }} />

            <div className="relative z-10">
              {badgeText && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3 text-white"
                  style={{ backgroundColor: "#C0392B" }}>
                  <Tag className="h-3 w-3" /> {badgeText}
                </span>
              )}
              <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: data.text_color || "#ffffff" }}>
                {title.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {i === arr.length - 1
                      ? <><span style={{ color: "#C0392B" }}>{line}</span></>
                      : <>{line}<br /></>}
                  </span>
                ))}
              </h3>
              {subtitle && (
                <p className="text-sm max-w-sm" style={{ color: (data.text_color || "#ffffff") + "99" }}>
                  {subtitle}
                </p>
              )}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
              {data.price_value && (
                <div className="bg-white rounded-xl p-5 text-center min-w-[180px]">
                  <p className="text-[#5C5C5C] text-xs mb-1">{priceLabel || ""}</p>
                  <p className="text-3xl font-bold" style={{ color: "#C0392B" }}>{data.price_value}</p>
                  {data.price_unit && <p className="text-[#5C5C5C] text-xs">/ {data.price_unit}</p>}
                </div>
              )}
              {ctaText && (
                <Link to={data.cta_link || "/catalog"}
                  className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#C0392B" }}>
                  {ctaText} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── variant="bottom" ──────────────────────────────────────────────────────
  const dbBottom = activeBanners.filter(b => b.type === "promo_bottom");
  const cards = dbBottom.length >= 2 ? dbBottom.slice(0, 2) : DEFAULT_BOTTOM;

  return (
    <section className="py-3 bg-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card, idx) => {
            const title    = bf(card, "title", lang);
            const subtitle = bf(card, "subtitle", lang);
            const badge    = bf(card, "badge_text", lang);
            const ctaText  = bf(card, "cta_text", lang);
            const isDark   = (card.bg_color || "#1A1A1A").toLowerCase() !== "#c0392b" && idx === 1;

            return (
              <div key={card.id || idx}
                className="relative rounded-xl overflow-hidden px-8 py-7 flex flex-col justify-between min-h-[180px]"
                style={{ backgroundColor: card.bg_color || "#C0392B" }}>
                <div className="absolute right-0 bottom-0 w-48 h-48 rounded-full opacity-10 translate-x-1/4 translate-y-1/4"
                  style={{ backgroundColor: isDark ? "#C0392B" : "#ffffff" }} />
                <div>
                  {badge && (
                    <span className="text-xs font-bold uppercase tracking-wider mb-1 block"
                      style={{ color: (card.text_color || "#ffffff") + "99" }}>{badge}</span>
                  )}
                  <h3 className="text-xl font-bold mt-1 mb-1" style={{ color: card.text_color || "#ffffff" }}>{title}</h3>
                  {subtitle && <p className="text-sm" style={{ color: (card.text_color || "#ffffff") + "cc" }}>{subtitle}</p>}
                </div>
                {ctaText && (
                  <Link to={card.cta_link || "/catalog"}
                    className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg self-start transition-opacity hover:opacity-90
                      ${isDark ? "text-white border border-white/30 hover:bg-white/10" : "bg-white"}`}
                    style={isDark ? {} : { color: "#C0392B" }}>
                    {ctaText} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
