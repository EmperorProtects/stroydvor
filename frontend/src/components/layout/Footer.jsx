import { Link } from "react-router-dom";
import { Phone, MapPin, Clock, Mail, MessageCircle, Instagram, Globe } from "lucide-react";
import Logo from "@/components/layout/Logo.jsx";
import { useApp } from "@/lib/AppContext";
import { useSettings } from "@/hooks/useSettings";

const LANG_CONFIG = [
  { code: "ru", label: "RU", name: "Русский",  flag: "🇷🇺" },
  { code: "kz", label: "KZ", name: "Қазақша", flag: "🇰🇿" },
  { code: "en", label: "EN", name: "English",  flag: "🇬🇧" },
];

export default function Footer() {
  const { t, lang, setLang, tField } = useApp();
  const { settings } = useSettings();

  // Навигация через t() для локализации
  const navLinks = [
    { labelKey: "home",     path: "/" },
    { labelKey: "catalog",  path: "/catalog" },
    { labelKey: "about",    path: "/about" },
    { labelKey: "contacts", path: "/contacts" },
  ];

  const PHONES = [
    { num: "phone",  label_key: "phone_label" },
    { num: "phone2", label_key: "phone2_label" },
    { num: "phone3", label_key: "phone3_label" },
    { num: "phone4", label_key: "phone4_label" },
    { num: "phone5", label_key: "phone5_label" },
  ].filter(({ num }) => settings[num]);

  // Описание с учётом языка
  const description = tField(settings, "description") || settings.description || "Строительные материалы с доставкой по Астане.";

  return (
    <footer className="bg-[#1A1A1A] text-white/80 pt-12 pb-6 mt-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Logo & description */}
          <div className="md:col-span-1">
            <Logo className="h-12 mb-4" />
            <p className="text-sm text-white/50 leading-relaxed">{description}</p>

            {/* Social */}
            <div className="flex items-center gap-3 mt-4">
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer"
                  className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors">
                  <MessageCircle className="h-4 w-4 text-white" />
                </a>
              )}
              {settings.instagram && (
                <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer"
                  className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center hover:bg-pink-500 transition-colors">
                  <Instagram className="h-4 w-4 text-white" />
                </a>
              )}
            </div>

            {/* Переключатель языка */}
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Globe className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Language</span>
              </div>
              <div className="flex gap-1.5">
                {LANG_CONFIG.map(({ code, label, name, flag }) => (
                  <button key={code} onClick={() => setLang(code)} title={name}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      lang === code
                        ? "bg-[#C0392B] text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                    }`}>
                    {flag} {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t("navigation")}</h4>
            <ul className="space-y-2">
              {navLinks.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="text-sm text-white/60 hover:text-white transition-colors">
                    {t(l.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Phones */}
          {PHONES.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-4">{t("phones")}</h4>
              <ul className="space-y-3">
                {PHONES.map(({ num, label_key }) => (
                  <li key={num}>
                    {settings[label_key] && (
                      <p className="text-[10px] text-white/35 mb-0.5 uppercase tracking-wide">
                        {settings[label_key]}
                      </p>
                    )}
                    <a href={`tel:${settings[num].replace(/\D/g, "")}`}
                      className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-[#C0392B] shrink-0" />
                      {settings[num]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contacts */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t("contacts")}</h4>
            <ul className="space-y-3">
              {settings.address && (
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[#C0392B] mt-0.5 shrink-0" />
                  {settings.map_link ? (
                    <a href={settings.map_link} target="_blank" rel="noreferrer"
                      className="text-white/60 hover:text-white transition-colors">{settings.address}</a>
                  ) : (
                    <span className="text-white/60">{settings.address}</span>
                  )}
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[#C0392B] shrink-0" />
                  <a href={`mailto:${settings.email}`} className="text-white/60 hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.work_hours && (
                <li className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[#C0392B] shrink-0" />
                  <span className="text-white/60">{settings.work_hours}</span>
                </li>
              )}
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <p>© {new Date().getFullYear()} {settings.company_name || "Строй-Двор"}. {t("allRights")}</p>
          <p>{settings.city || "Астана"}, Казахстан</p>
        </div>
      </div>
    </footer>
  );
}
