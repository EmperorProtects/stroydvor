import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const perks = [
  "Более 10 000 наименований в наличии",
  "Доставка по Астане от 2 часов",
  "Рассрочка через Kaspi без переплат",
  "Персональный менеджер для каждого клиента",
  "Гарантия низкой цены — найдём дешевле, вернём разницу",
];

export default function LoyaltySection() {
  return (
    <section className="py-20 bg-secondary/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="https://media.base44.com/images/public/69ce443e3ef8d5eca540d967/576a36446_generated_image.png"
                alt="Наш специалист"
                className="w-full h-[500px] object-cover object-top rounded-2xl"
              />
              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 bg-primary text-primary-foreground rounded-xl px-5 py-4 shadow-xl">
                <div className="text-2xl font-bold font-heading">20+ лет</div>
                <div className="text-sm opacity-90">опыта в строительстве</div>
              </div>
            </div>
            {/* Decorative accent */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full -z-10" />
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-foreground/5 rounded-full -z-10" />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase rounded-full mb-4">
              Почему нам доверяют
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3 leading-tight">
              Строй-Двор —<br />
              <span className="text-primary">Топ-1 поставщик</span> Казахстана
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Мы помогаем тысячам казахстанских семей и строительных компаний 
              реализовывать проекты любого масштаба. От фундамента до крыши — 
              всё есть на нашем складе в Астане.
            </p>
            <ul className="space-y-3 mb-8">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{perk}</span>
                </li>
              ))}
            </ul>
            <Link to="/catalog">
              <Button size="lg" className="gap-2 font-semibold px-8 h-12">
                Смотреть каталог <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}