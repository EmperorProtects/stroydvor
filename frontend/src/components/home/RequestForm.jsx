import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Consultation } from "@/api/apiClient";
import { loadSettings } from "@/pages/admin/AdminSettings";

export default function RequestForm() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const settings = loadSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Consultation.create({
        name: form.name,
        phone: form.phone,
        message: form.message,
        source: "Форма на сайте",
      });
      toast.success("Заявка принята! Перезвоним в течение 15 минут.");
      setForm({ name: "", phone: "", message: "" });
    } catch {
      toast.error("Ошибка отправки, попробуйте позже");
    }
    setLoading(false);
  };

  const phone  = settings.phone  || "+7 (700) 123-45-67";
  const wa     = settings.whatsapp ? `https://wa.me/${settings.whatsapp}` : null;

  return (
    <section className="py-20 bg-foreground text-background overflow-hidden relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-semibold tracking-wider uppercase rounded-full mb-4">
              Оставьте заявку
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-background">
              Получите бесплатную консультацию
            </h2>
            <p className="text-background/60 leading-relaxed mb-8">
              Наш специалист перезвонит в течение 15 минут, поможет с выбором
              материалов и рассчитает точную стоимость вашего проекта.
            </p>
            <div className="space-y-4">
              <a href={`tel:${phone.replace(/\D/g, "")}`} className="flex items-center gap-3 group">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/80 transition-colors">
                  <Phone className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs text-background/50">Позвонить прямо сейчас</div>
                  <div className="font-semibold text-background">{phone}</div>
                </div>
              </a>
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-background" />
                  </div>
                  <div>
                    <div className="text-xs text-background/50">Пишите в WhatsApp</div>
                    <div className="font-semibold text-background">{phone}</div>
                  </div>
                </a>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <div className="bg-background/5 border border-background/10 rounded-2xl p-8 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-background/80 mb-1.5 block">Ваше имя *</label>
                  <Input placeholder="Как вас зовут?" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus-visible:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-background/80 mb-1.5 block">Телефон *</label>
                  <Input placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus-visible:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-background/80 mb-1.5 block">Что вас интересует?</label>
                  <Textarea placeholder="Опишите ваш проект или вопрос..." rows={3} value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus-visible:ring-primary resize-none" />
                </div>
                <Button type="submit" size="lg" className="w-full h-12 font-semibold gap-2" disabled={loading}>
                  {loading ? "Отправляем..." : (<><Send className="h-4 w-4" /> Получить консультацию</>)}
                </Button>
                <p className="text-xs text-center text-background/40">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
