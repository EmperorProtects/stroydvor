/**
 * LangTabs — переключатель вкладок RU / KZ / EN для форм в Админ-панели.
 *
 * Использование:
 *   const [lang, setLang] = useState('ru');
 *   <LangTabs lang={lang} onChange={setLang} />
 *
 *   // Затем в форме:
 *   <LangField lang={lang} form={form} setForm={setForm}
 *              field="title" label="Название" required />
 */
import { Globe } from 'lucide-react';

const LANG_CONFIG = [
  { code: 'ru', label: 'RU', name: 'Русский',  flag: '🇷🇺' },
  { code: 'kz', label: 'KZ', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'en', label: 'EN', name: 'English',  flag: '🇬🇧' },
];

/** Основные вкладки */
export function LangTabs({ lang, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe className="h-4 w-4 text-muted-foreground mr-1" />
      {LANG_CONFIG.map(({ code, label, name, flag }) => (
        <button
          key={code}
          type="button"
          title={name}
          onClick={() => onChange(code)}
          className={`
            px-3 py-1.5 rounded-md text-xs font-semibold transition-all
            ${lang === code
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}
          `}
        >
          {flag} {label}
        </button>
      ))}
    </div>
  );
}

/** Поле формы с автоматической привязкой к языковому ключу.
 *  field='title' + lang='kz' → читает/пишет form.title_kz */
export function LangField({
  lang, form, setForm,
  field,           // базовое имя поля (без суффикса)
  label,           // метка
  required = false,
  placeholder = '',
  multiline = false,
  rows = 3,
  className = '',
}) {
  const key = `${field}_${lang}`;
  const value = form[key] ?? '';
  const handleChange = (e) => setForm({ ...form, [key]: e.target.value });

  const baseClass = `w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground
    focus:outline-none focus:ring-2 focus:ring-red-500/40 ${className}`;

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-muted-foreground block mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          <span className="ml-1 text-[10px] text-muted-foreground/60 uppercase">[{lang.toUpperCase()}]</span>
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={handleChange}
          rows={rows}
          placeholder={placeholder}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${baseClass} h-9`}
        />
      )}
    </div>
  );
}

/** Блок полей для одной секции (название + описание + SEO) — для удобства */
export function LangSection({ lang, form, setForm, withSeo = false, withDescription = true }) {
  return (
    <div className="space-y-3">
      <LangField lang={lang} form={form} setForm={setForm}
                 field="title" label="Название" required />
      {withDescription && (
        <LangField lang={lang} form={form} setForm={setForm}
                   field="description" label="Описание" multiline rows={3} />
      )}
      {withSeo && (
        <>
          <LangField lang={lang} form={form} setForm={setForm}
                     field="seo_title" label="SEO заголовок" />
          <LangField lang={lang} form={form} setForm={setForm}
                     field="seo_description" label="SEO описание" multiline rows={2} />
          <LangField lang={lang} form={form} setForm={setForm}
                     field="keywords" label="Ключевые слова" />
        </>
      )}
    </div>
  );
}

export default LangTabs;
