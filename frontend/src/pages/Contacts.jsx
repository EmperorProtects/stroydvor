import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { Consultation } from "@/api/apiClient";

export default function Contacts() {
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  const PHONES = [
    { num: "phone",  label_key: "phone_label" },
    { num: "phone2", label_key: "phone2_label" },
    { num: "phone3", label_key: "phone3_label" },
    { num: "phone4", label_key: "phone4_label" },
    { num: "phone5", label_key: "phone5_label" },
  ].filter(({ num }) => settings[num]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Consultation.create({
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        source: "Страница контактов",
      });
      toast.success("Заявка отправлена! Мы перезвоним вам.");
      setFormData({ name: "", phone: "", message: "" });
    } catch {
      toast.error("Ошибка отправки, попробуйте позже");
    }
    setLoading(false);
  };

  return (
    <div className="bg-background">
      <div className="bg-foreground text-background py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">Контакты</h1>
          <p className="text-background/60 max-w-xl text-lg">Свяжитесь с нами любым удобным способом</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="font-heading text-2xl font-bold mb-8">Наши контакты</h2>

            {/* Phones by department */}
            {PHONES.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide mb-4">
                  Телефоны по отделам
                </h3>
                <div className="space-y-3">
                  {PHONES.map(({ num, label_key }) => (
                    <div key={num} className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        {settings[label_key] && (
                          <p className="text-xs text-muted-foreground mb-0.5">{settings[label_key]}</p>
                        )}
                        <a href={`tel:${settings[num].replace(/\D/g, "")}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors text-base">
                          {settings[num]}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other contacts */}
            <div className="space-y-4">
              {settings.email && (
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-0.5">Email</p>
                    <a href={`mailto:${settings.email}`} className="font-medium hover:text-primary transition-colors">
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}
              {settings.address && (
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-0.5">Адрес</p>
                    {settings.map_link ? (
                      <a href={settings.map_link} target="_blank" rel="noreferrer"
                        className="font-medium hover:text-primary transition-colors">
                        {settings.address}
                      </a>
                    ) : (
                      <p className="font-medium">{settings.address}</p>
                    )}
                  </div>
                </div>
              )}
              {settings.work_hours && (
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-0.5">Режим работы</p>
                    <p className="font-medium">{settings.work_hours}</p>
                  </div>
                </div>
              )}
              {settings.whatsapp && (
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-0.5">WhatsApp</p>
                    <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer"
                      className="font-medium hover:text-green-600 transition-colors">
                      +{settings.whatsapp}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-bold">Обратная связь</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Имя</label>
                  <Input placeholder="Ваше имя" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Телефон</label>
                  <Input placeholder="+7 (___) ___-__-__" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Сообщение</label>
                  <Textarea placeholder="Опишите ваш запрос..." rows={4} value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                </div>
                <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
                  {loading ? "Отправка..." : "Отправить заявку"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
