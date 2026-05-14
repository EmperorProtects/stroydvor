import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight } from "lucide-react";

export default function CtaSection() {
  const { settings } = useSettings();
  const phone = settings.phone || "{phone}";
  return (
    <section className="py-20 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
          Нужна помощь с выбором?
        </h2>
        <p className="text-background/60 max-w-lg mx-auto mb-8">
          Наши специалисты помогут подобрать материалы для вашего проекта, 
          рассчитают количество и предложат лучшие цены
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href={`tel:${(phone).replace(/\D/g, "")}`}>
            <Button size="lg" className="gap-2 font-semibold px-8 h-12">
              <Phone className="h-4 w-4" /> Позвонить
            </Button>
          </a>
          <Link to="/catalog">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 font-semibold px-8 h-12 border-background/30 text-background hover:bg-background/10 hover:text-background"
            >
              Перейти в каталог <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}