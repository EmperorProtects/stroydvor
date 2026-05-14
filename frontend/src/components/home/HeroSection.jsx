import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/69ce443e3ef8d5eca540d967/6ac7e2c5e_generated_eaec96b4.png"
          alt="Строительные материалы"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(26,26,26,0.92) 40%, rgba(26,26,26,0.55) 100%)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-36 lg:py-44">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-xl"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-wider uppercase rounded-full mb-6 text-white" style={{ backgroundColor: "#C0392B" }}>
            Топ-1 поставщик Казахстана
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
            Всё для строительства и ремонта
          </h1>
          <p className="text-white/70 text-lg mb-8 leading-relaxed">
            Более 10 000 наименований строительных материалов. Быстрая доставка по Астане.
            Рассрочка через Kaspi.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/catalog">
              <Button size="lg" className="gap-2 font-semibold px-8 h-12 border-0 text-white" style={{ backgroundColor: "#C0392B" }}>
                Каталог товаров
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contacts">
              <Button size="lg" variant="outline" className="gap-2 font-semibold px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                Связаться с нами
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl"
        >
          {[
            { icon: Truck, label: "Доставка от 2 часов" },
            { icon: Shield, label: "Гарантия качества" },
            { icon: Clock, label: "Работаем без выходных" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10"
            >
              <item.icon className="h-5 w-5 shrink-0" style={{ color: "#C0392B" }} />
              <span className="text-white text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}