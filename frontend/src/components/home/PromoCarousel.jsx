import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function PromoCarousel() {
  const { data: banners = [] } = useQuery({
    queryKey: ["promoBanners"],
    queryFn: () => base44.entities.PromoBanner.list("sort_order"),
  });

  const sliderBanners = banners.filter(b => b.type === "slider").slice(0, 6);
  const promoCards = banners.filter(b => b.type === "promo_card").slice(0, 4);

  if (sliderBanners.length === 0 && promoCards.length === 0) return null;

  return (
    <>
      {/* Slider banners */}
      {sliderBanners.length > 0 && (
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sliderBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="relative rounded-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 px-5 py-5 md:px-8 md:py-8 min-h-[160px] md:min-h-[220px]"
                  style={{ backgroundColor: banner.bg_color || "#1A1A1A" }}
                >
                  {/* Background image if available */}
                  {banner.image_url && (
                    <div className="absolute inset-0 opacity-30 overflow-hidden">
                      <img src={banner.image_url} alt="" className="w-full h-full object-cover object-center" />
                    </div>
                  )}

                  {/* Decorative circles */}
                  <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: "#C0392B", transform: "translate(30%, -40%)" }} />
                  <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: "#C0392B", transform: "translateY(40%)" }} />

                  <div className="relative z-10">
                    {banner.badge_text && (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
                        style={{ backgroundColor: "#C0392B", color: "white" }}
                      >
                        {banner.badge_text}
                      </span>
                    )}
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 leading-tight" style={{ color: banner.text_color || "white" }}>
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs sm:text-sm max-w-sm" style={{ color: banner.text_color ? `${banner.text_color}cc` : "rgba(255,255,255,0.6)" }}>
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  {banner.cta_link && banner.cta_text && (
                    <Link
                      to={banner.cta_link}
                      className="relative z-10 flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#C0392B", color: "white" }}
                    >
                      {banner.cta_text} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo cards grid */}
      {promoCards.length > 0 && (
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {promoCards.map((banner) => (
                <Link
                  key={banner.id}
                  to={banner.cta_link || "#"}
                  className="relative rounded-xl overflow-hidden px-4 sm:px-6 py-4 sm:py-6 flex flex-col justify-between min-h-[140px] sm:min-h-[180px] transition-transform hover:shadow-lg hover:-translate-y-1"
                  style={{ backgroundColor: banner.bg_color || "#C0392B" }}
                >
                  {/* Background image */}
                  {banner.image_url && (
                    <div className="absolute inset-0 opacity-25 overflow-hidden">
                      <img src={banner.image_url} alt="" className="w-full h-full object-cover object-center" />
                    </div>
                  )}

                  <div className="absolute right-0 bottom-0 w-40 h-40 rounded-full bg-white opacity-10 translate-x-1/4 translate-y-1/4" />

                  <div className="relative z-10">
                    {banner.badge_text && (
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `${banner.text_color}80` || "rgba(255,255,255,0.5)" }}>
                        {banner.badge_text}
                      </span>
                    )}
                    <h3 className="text-sm sm:text-lg font-bold mt-1 sm:mt-2 mb-1 leading-snug" style={{ color: banner.text_color || "white" }}>
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-sm" style={{ color: banner.text_color ? `${banner.text_color}cc` : "rgba(255,255,255,0.7)" }}>
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  {banner.cta_text && (
                    <div className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold mt-4 w-fit px-3 py-2 rounded-lg" style={{ backgroundColor: banner.text_color || "white", color: banner.bg_color || "#C0392B" }}>
                      {banner.cta_text} <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
