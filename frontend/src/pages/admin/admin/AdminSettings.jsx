import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Store, Phone, MapPin, Mail, Clock, Globe, MessageCircle, Instagram, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteSettings } from "@/api/apiClient";
import { DEFAULT_SETTINGS, cacheSettings, loadSettings } from "@/hooks/useSettings";

// Re-export for backward compatibility (Header, Contacts, RequestForm still import loadSettings from here)
export { loadSettings };
export const STORAGE_KEY  = "site_settings_cache";
export const defaultSettings = DEFAULT_SETTINGS;

export default function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from MongoDB on mount
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn:  SiteSettings.get,
    staleTime: 60000,
  });

  useEffect(() => {
    if (serverSettings) {
      const merged = { ...DEFAULT_SETTINGS, ...serverSettings };
      setForm(merged);
      cacheSettings(merged);
    }
  }, [serverSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved_data = await SiteSettings.save(form);
      cacheSettings({ ...DEFAULT_SETTINGS, ...saved_data });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      setSaved(true);
      toast.success("Настройки сохранены");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error(e.message || "Ошибка сохранения");
    }
    setSaving(false);
  };

  const f = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const Field = ({ label, icon: FieldIcon, name, placeholder, type = "text" }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <div className="relative">
        {FieldIcon && <FieldIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <Input
          type={type}
          value={form[name] || ""}
          onChange={e => f(name, e.target.value)}
          placeholder={placeholder}
          className={FieldIcon ? "pl-9" : ""}
          disabled={isLoading}
        />
      </div>
    </div>
  );

  const PHONES = [
    { num: "phone",  label_key: "phone_label",  default_label: "отдел стройматериалов" },
    { num: "phone2", label_key: "phone2_label", default_label: "отдел мебели для бани и сада" },
    { num: "phone3", label_key: "phone3_label", default_label: "отдел сантехники" },
    { num: "phone4", label_key: "phone4_label", default_label: "отдел сухих строительных смесей" },
    { num: "phone5", label_key: "phone5_label", default_label: "отдел пошива штор" },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Настройки сайта</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Контакты и данные компании · хранятся в MongoDB · отображаются в Footer, Header, Контактах
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || isLoading}
          className="gap-2 text-white" style={{ backgroundColor: saved ? "#16a34a" : "#C0392B" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? "Сохранено ✓" : saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка настроек...
        </div>
      )}

      {/* Связь с сайтом */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-semibold mb-1">🔗 Данные используются на сайте</p>
        <p className="text-xs">
          <strong>Footer</strong> — телефон, email, адрес, режим работы · <strong>Header</strong> — главный телефон ·
          <strong>Страница контактов</strong> — все телефоны по отделам · <strong>Кнопка WhatsApp</strong> — виджет в углу экрана
        </p>
      </div>

      <div className="space-y-6">
        {/* Company */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">О компании</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Название компании" name="company_name" placeholder="Строй-Двор" />
            <Field label="Город" icon={MapPin} name="city" placeholder="Астана" />
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Краткое описание (Footer)</label>
              <Input value={form.description || ""} onChange={e => f("description", e.target.value)}
                placeholder="Строительные материалы с доставкой по Астане." />
            </div>
          </div>
        </div>

        {/* Phones by department */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">Телефоны по отделам</h2>
            <span className="text-xs text-muted-foreground ml-auto">Первый телефон — отображается в Header</span>
          </div>
          <div className="space-y-4">
            {PHONES.map(({ num, label_key, default_label }, i) => (
              <div key={num} className={`grid grid-cols-1 md:grid-cols-2 gap-3 pb-4 ${i < PHONES.length - 1 ? "border-b border-border" : ""}`}>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Номер {i + 1} {i === 0 && <span className="text-[#C0392B]">← главный</span>}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={form[num] || ""} onChange={e => f(num, e.target.value)}
                      placeholder="+7‒700‒000‒00‒00" className="pl-9" disabled={isLoading} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Подпись (отдел)</label>
                  <Input value={form[label_key] || ""} onChange={e => f(label_key, e.target.value)}
                    placeholder={default_label} disabled={isLoading} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other contacts */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">Прочие контакты</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" icon={Mail} name="email" placeholder="info@stroydvor.kz" type="email" />
            <Field label="Часы работы" icon={Clock} name="work_hours" placeholder="Пн–Сб: 9:00–19:00" />
            <div className="md:col-span-2">
              <Field label="Адрес" icon={MapPin} name="address" placeholder="г. Астана, ул. Строителей, 12" />
            </div>
            <div className="md:col-span-2">
              <Field label="Ссылка на Google Maps / 2GIS" icon={Globe} name="map_link" placeholder="https://maps.google.com/..." />
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">Социальные сети</h2>
            <span className="text-xs text-muted-foreground ml-auto">WhatsApp — плавающая кнопка на сайте</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">WhatsApp (только цифры)</label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                <Input value={form.whatsapp || ""} onChange={e => f("whatsapp", e.target.value.replace(/\D/g, ""))}
                  placeholder="77001234567" className="pl-9" disabled={isLoading} />
              </div>
              {form.whatsapp && (
                <a href={`https://wa.me/${form.whatsapp}`} target="_blank" rel="noreferrer"
                  className="text-xs text-green-600 hover:underline mt-1 block">
                  wa.me/{form.whatsapp} →
                </a>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Instagram (username без @)</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500" />
                <Input value={form.instagram || ""} onChange={e => f("instagram", e.target.value.replace("@", ""))}
                  placeholder="stroydvor_kz" className="pl-9" disabled={isLoading} />
              </div>
              {form.instagram && (
                <a href={`https://instagram.com/${form.instagram}`} target="_blank" rel="noreferrer"
                  className="text-xs text-pink-500 hover:underline mt-1 block">
                  instagram.com/{form.instagram} →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-secondary border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 text-muted-foreground text-sm uppercase tracking-wide flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Предпросмотр — как выглядит в Footer и Header
          </h2>
          <div className="space-y-2">
            {PHONES.map(({ num, label_key }) => form[num] ? (
              <div key={num} className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-[#C0392B] shrink-0" />
                <a href={`tel:${form[num].replace(/\D/g, "")}`}
                  className="font-semibold text-foreground hover:text-[#C0392B] transition-colors">
                  {form[num]}
                </a>
                {form[label_key] && <span className="text-muted-foreground">— {form[label_key]}</span>}
              </div>
            ) : null)}
            {form.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-[#C0392B] shrink-0" />
                <span className="text-muted-foreground">{form.address}</span>
              </div>
            )}
            {form.work_hours && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-[#C0392B] shrink-0" />
                <span className="text-muted-foreground">{form.work_hours}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
