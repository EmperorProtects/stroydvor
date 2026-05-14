import HeroBanner from "../components/home/HeroBanner";
import CategoriesSection from "../components/home/CategoriesSection";
import FeaturedSections from "../components/home/FeaturedSections";
import PromoCarousel from "../components/home/PromoCarousel";

export default function Home() {
  return (
    <div className="bg-background">
      <HeroBanner />
      <PromoCarousel />
      <FeaturedSections />
      <CategoriesSection />
    </div>
  );
}