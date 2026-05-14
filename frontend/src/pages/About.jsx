import { Award, Users, TrendingUp, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { icon: Award, value: "18+", label: "Лет на рынке" },
  { icon: Users, value: "5 000+", label: "Довольных клиентов" },
  { icon: TrendingUp, value: "10 000+", label: "Наименований" },
  { icon: MapPin, value: "3", label: "Склада в Москве" },
];

export default function About() {
  return (
    <div className="bg-background">
      <div className="bg-foreground text-background py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">О компании</h1>
          <p className="text-background/60 max-w-xl text-lg">
            Строй-Двор — ваш надёжный партнёр в строительстве с 2005 года
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6">
              Надёжность, проверенная временем
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Компания «Строй-Двор» была основана в 2005 году и за это время заслужила репутацию 
                надёжного поставщика строительных материалов. Мы работаем как с частными клиентами, 
                так и со строительными организациями.
              </p>
              <p>
                Наш ассортимент включает более 10 000 наименований продукции от ведущих производителей. 
                Мы тщательно отбираем поставщиков и гарантируем качество каждого товара.
              </p>
              <p>
                Собственные складские помещения позволяют поддерживать постоянный запас 
                наиболее востребованных материалов и обеспечивать быструю доставку.
              </p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden">
            <img
              src="https://media.base44.com/images/public/69ce443e3ef8d5eca540d967/6ac7e2c5e_generated_eaec96b4.png"
              alt="Строительные материалы"
              className="w-full h-80 object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-8 rounded-xl border border-border bg-card"
            >
              <stat.icon className="h-8 w-8 mx-auto text-primary mb-3" />
              <div className="text-3xl font-bold font-heading mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
