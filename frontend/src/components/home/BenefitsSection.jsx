import { Truck, Shield, Headphones, CreditCard, Package, Clock } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: Truck,
    title: "Быстрая доставка",
    desc: "Доставим заказ от 2 часов по Москве и области",
  },
  {
    icon: Shield,
    title: "Гарантия качества",
    desc: "Только сертифицированная продукция от проверенных поставщиков",
  },
  {
    icon: Headphones,
    title: "Консультация",
    desc: "Профессиональные менеджеры помогут с выбором",
  },
  {
    icon: CreditCard,
    title: "Удобная оплата",
    desc: "Наличный и безналичный расчёт, оплата по карте",
  },
  {
    icon: Package,
    title: "Большой выбор",
    desc: "Более 10 000 наименований на складе",
  },
  {
    icon: Clock,
    title: "Удобный график",
    desc: "Работаем ежедневно с 8:00 до 20:00",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-16 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
            Почему выбирают нас
          </h2>
          <p className="text-[#5C5C5C]">
            Строй-Двор — это надёжность, качество и профессиональный сервис
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="p-6 rounded-lg border border-[#E0E0E0] bg-white hover:shadow-md hover:border-[#C0392B] transition-all"
            >
              <div className="h-11 w-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#FDECEA" }}>
                <item.icon className="h-5 w-5" style={{ color: "#C0392B" }} />
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A] mb-1.5">{item.title}</h3>
              <p className="text-[#5C5C5C] text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}