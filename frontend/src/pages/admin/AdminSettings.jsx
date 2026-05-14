import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Store, Phone, MapPin, Mail, Clock, Globe, MessageCircle, Instagram, Loader2, CreditCard, Navigation } from "lucide-react";
import { SiteSettings } from "@/api/apiClient";
import { toast } from "sonner";

const DEFAULT = {
  company_name: "Строй-Двор",
  phone:        "+7‒707‒290‒05‒05",
  phone_label:  "отдел стройматериалов",
  phone2:       "+7‒701‒320‒01‒48",
  phone2_label: "отдел мебели для бани и сада",
  phone3:       "+7‒771‒288‒88‒09",
  phone3_label: "отдел сантехники",
  phone4:       "+7‒747‒730‒00‒70",
  phone4_label: "отдел сухих строительных смесей",
  phone5:       "+7‒705‒140‒89‒07",
  phone5_label: "отдел пошива штор",
  email:        "info@stroydvor.kz",
  address:      "г. Астана, ул. Строителей, 12",
  city:         "Астана",
  work_hours:   "Пн–Сб: 9:00–19:00",
  whatsapp:     "77072900505",
  instagram:    "stroydvor_kz",
  map_link:     "",
  description:  "Строительные материалы с доставкой по Астане.",
  // Оплата и самовывоз
  kaspi_pay_link:   "https://pay.kaspi.kz/pay/nbvnqerz",
  pickup_address:   "",
  pickup_2gis_link: "",
};

const PHONES = [
  { num: "phone",  labelKey: "phone_label",  hint: "главный — показывается в шапке сайта" },
  { num: "phone2", labelKey: "phone2_label", hint: "" },
  { num: "phone3", labelKey: "phone3_label", hint: "" },
  { num: "phone4", labelKey: "phone4_label", hint: "" },
  { num: "phone5", labelKey: "phone5_label", hint: "" },
];

export default function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Загружаем настройки с сервера
  const { data, isLoading, isError } = useQuery({
    queryKey: ["site_settings"],
    queryFn:  SiteSettings.get,
    staleTime: 0, // всегда свежие данные при открытии страницы
  });

  // Когда данные пришли — заполняем форму
  useEffect(() => {
    if (data) setForm({ ...DEFAULT, ...data });
  }, [data]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await SiteSettings.save(form);
      // Инвалидируем кэш — Footer, Header, SocialWidget обновятся автоматически
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      setSavedOk(true);
      toast.success("Настройки сохранены — сайт обновится автоматически");
      setTimeout(() => setSavedOk(false), 3000);
    } catch (e) {
      toast.error("Ошибка: " + (e.message || "не удалось сохранить"));
    }
    setSaving(false);
  };

  // Переиспользуемый компонент поля
  const Field = ({ label, name, placeholder, icon: Icon, type = "text", hint, colSpan }) => (
    <div className={colSpan ? "md:col-span-2" : ""}>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label}
        {hint && <span className="text-[#C0392B] ml-1">{hint}</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />}
        <Input
          type={type}
          value={form[name] || ""}
          onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={Icon ? "pl-9" : ""}
        />
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Загружаем настройки...
    </div>
  );

  if (isError) return (
    <div className="p-8 text-red-500">
      Не удалось загрузить настройки. Проверьте что бэкенд запущен и роутер /api/settings/ подключён.
    </div>
  );

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Настройки сайта</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Данные хранятся в MongoDB · Footer, Header, Контакты обновляются автоматически
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 text-white min-w-[140px] justify-center"
          style={{ backgroundColor: savedOk ? "#16a34a" : "#C0392B" }}
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение…</>
            : savedOk
              ? <><Save className="h-4 w-4" /> Сохранено ✓</>
              : <><Save className="h-4 w-4" /> Сохранить</>
          }
        </Button>
      </div>

      <div className="space-y-6">

        {/* О компании */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">О компании</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Название компании" name="company_name" placeholder="Строй-Двор" />
            <Field label="Город" name="city" placeholder="Астана" icon={MapPin} />
            <Field label="Краткое описание (Footer)" name="description"
              placeholder="Строительные материалы с доставкой по Астане." colSpan />
          </div>
        </div>

        {/* Телефоны */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">Телефоны по отделам</h2>
          </div>
          <div className="space-y-4">
            {PHONES.map(({ num, labelKey, hint }, i) => (
              <div key={num} className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${i < PHONES.length - 1 ? "pb-4 border-b border-border" : ""}`}>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Номер {i + 1}
                    {hint && <span className="text-[#C0392B] ml-1 font-normal">← {hint}</span>}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={form[num] || ""}
                      onChange={e => set(num, e.target.value)}
                      placeholder="+7‒700‒000‒00‒00"
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Подпись отдела</label>
                  <Input
                    value={form[labelKey] || ""}
                    onChange={e => set(labelKey, e.target.value)}
                    placeholder="название отдела"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Контакты */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">Прочие контакты</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" name="email" placeholder="info@stroydvor.kz" icon={Mail} type="email" />
            <Field label="Часы работы" name="work_hours" placeholder="Пн–Сб: 9:00–19:00" icon={Clock} />
            <Field label="Адрес" name="address" placeholder="г. Астана, ул. Строителей, 12" icon={MapPin} colSpan />
            <Field label="Ссылка на карту (Google Maps / 2GIS)" name="map_link"
              placeholder="https://maps.google.com/..." icon={Globe} colSpan />
          </div>
        </div>

        {/* Оплата и самовывоз */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">Оплата и самовывоз</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Ссылка Kaspi Pay открывается при оформлении заказа · Адрес и 2GIS показывается при выборе самовывоза
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ссылка Kaspi Pay" name="kaspi_pay_link"
              placeholder="https://pay.kaspi.kz/pay/nbvnqerz" icon={CreditCard} colSpan />
            <Field label="Адрес самовывоза" name="pickup_address"
              placeholder="г. Астана, пр. Республики, 12" icon={MapPin} colSpan />
            <Field label="Ссылка 2GIS (точка самовывоза)" name="pickup_2gis_link"
              placeholder="https://2gis.kz/astana/firm/..." icon={Globe} colSpan />
          </div>
        </div>

        {/* Соцсети */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-5 w-5 text-[#C0392B]" />
            <h2 className="font-semibold">Социальные сети</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            WhatsApp — плавающая кнопка на сайте · Instagram — иконка в подвале
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">WhatsApp (только цифры)</label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                <Input
                  value={form.whatsapp || ""}
                  onChange={e => set("whatsapp", e.target.value.replace(/\D/g, ""))}
                  placeholder="77001234567"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              {form.whatsapp && (
                <a href={`https://wa.me/${form.whatsapp}`} target="_blank" rel="noreferrer"
                  className="text-xs text-green-600 hover:underline mt-1.5 block">
                  wa.me/{form.whatsapp} →
                </a>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Instagram (без @)</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500 pointer-events-none" />
                <Input
                  value={form.instagram || ""}
                  onChange={e => set("instagram", e.target.value.replace("@", ""))}
                  placeholder="stroydvor_kz"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              {form.instagram && (
                <a href={`https://instagram.com/${form.instagram}`} target="_blank" rel="noreferrer"
                  className="text-xs text-pink-500 hover:underline mt-1.5 block">
                  instagram.com/{form.instagram} →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Предпросмотр */}
        <div className="bg-secondary border border-border rounded-xl p-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Предпросмотр — как выглядит в Footer и на странице Контакты
          </h2>
          <div className="space-y-2">
            {PHONES.map(({ num, labelKey }) => form[num] ? (
              <div key={num} className="flex items-center gap-3 text-sm">
                <Phone className="h-3.5 w-3.5 text-[#C0392B] shrink-0" />
                <a href={`tel:${form[num].replace(/\D/g, "")}`}
                  className="font-semibold hover:text-[#C0392B] transition-colors">
                  {form[num]}
                </a>
                {form[labelKey] && (
                  <span className="text-muted-foreground text-xs">— {form[labelKey]}</span>
                )}
              </div>
            ) : null)}
            {form.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-3.5 w-3.5 text-[#C0392B] shrink-0" />
                <span className="text-muted-foreground">{form.address}</span>
              </div>
            )}
            {form.work_hours && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-3.5 w-3.5 text-[#C0392B] shrink-0" />
                <span className="text-muted-foreground">{form.work_hours}</span>
              </div>
            )}
            {form.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-3.5 w-3.5 text-[#C0392B] shrink-0" />
                <span className="text-muted-foreground">{form.email}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
