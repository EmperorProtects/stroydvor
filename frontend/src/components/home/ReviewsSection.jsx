import { Star } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Асет Жаксыбеков",
    role: "Частный застройщик",
    text: "Заказывал кровельные материалы и утеплитель. Всё привезли в день заказа, качество отличное. Менеджер помог с расчётом, ничего лишнего не купил. Рекомендую!",
    rating: 5,
    image: "https://media.base44.com/images/public/69ce443e3ef8d5eca540d967/9d2b2a8f8_generated_image.png",
  },
  {
    name: "Гульмира Сейткали",
    role: "Дизайнер интерьера",
    text: "Огромный выбор строительных материалов. Оплатила через Kaspi рассрочку — очень удобно. Доставка быстрая, упаковка надёжная. Работаю только с ними.",
    rating: 5,
    image: "https://media.base44.com/images/public/69ce443e3ef8d5eca540d967/3ab2533fc_generated_image.png",
  },
  {
    name: "Дмитрий Ковалёв",
    role: "Прораб строительной компании",
    text: "Закупаем материалы оптом уже 3 года. Цены честные, всегда в наличии нужные позиции. Личный менеджер решает любой вопрос оперативно.",
    rating: 5,
    image: "https://media.base44.com/images/public/69ce443e3ef8d5eca540d967/19fcd3e43_generated_image.png",
  },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < count ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Отзывы клиентов</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Более 5 000 довольных покупателей по всему Казахстану
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col"
            >
              <Stars count={review.rating} />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed flex-1">
                "{review.text}"
              </p>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <img
                  src={review.image}
                  alt={review.name}
                  className="h-11 w-11 rounded-full object-cover object-top"
                />
                <div>
                  <div className="font-semibold text-sm">{review.name}</div>
                  <div className="text-xs text-muted-foreground">{review.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}