import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Globe } from "lucide-react";
import { toast } from "sonner";

// ─── Языковые вкладки ─────────────────────────────────────────────────────────
const LANGS = [
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "kz", label: "KZ", flag: "🇰🇿" },
  { code: "en", label: "EN", flag: "🇬🇧" },
];

function LangTabs({ lang, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <Globe className="h-3.5 w-3.5 text-muted-foreground mr-1" />
      {LANGS.map(({ code, label, flag }) => (
        <button key={code} type="button" onClick={() => onChange(code)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all
            ${lang === code ? "bg-red-600 text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
          {flag} {label}
        </button>
      ))}
    </div>
  );
}

// Поле с языковым суффиксом: field="title" + lang="kz" → form.title_kz
function LangInput({ lang, form, setForm, field, label, placeholder = "", textarea = false }) {
  const key = `${field}_${lang}`;
  const val = form[key] ?? "";
  const onChange = (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const cls = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30";
  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-muted-foreground block mb-1">
          {label} <span className="text-[10px] opacity-50 uppercase">[{lang}]</span>
        </label>
      )}
      {textarea ? (
        <textarea value={val} onChange={onChange} placeholder={placeholder} rows={2} className={`${cls} resize-none`} />
      ) : (
        <input type="text" value={val} onChange={onChange} placeholder={placeholder} className={`${cls} h-9`} />
      )}
    </div>
  );
}

// ─── Тип баннера → отображаемые поля ─────────────────────────────────────────
const TYPE_LABELS = {
  slider:       "Слайдер",
  promo_card:   "Мини-карточка",
  promo_top:    "Промо «Акция месяца»",
  promo_bottom: "Промо-карточка (низ)",
};

const EMPTY = {
  type: "slider",
  // RU (основное)
  title: "", title_ru: "", title_kz: "", title_en: "",
  subtitle: "", subtitle_ru: "", subtitle_kz: "", subtitle_en: "",
  cta_text: "", cta_text_ru: "", cta_text_kz: "", cta_text_en: "",
  badge_text: "", badge_text_ru: "", badge_text_kz: "", badge_text_en: "",
  price_label: "", price_label_ru: "", price_label_kz: "", price_label_en: "",
  cta_link: "/catalog",
  price_value: "", price_unit: "м²",
  image_url: "",
  bg_color: "#1a3a2a",
  text_color: "#ffffff",
  is_active: true,
  sort_order: 0,
};

export default function AdminBanners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [langTab, setLangTab] = useState("ru");

  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: () => base44.entities.PromoBanner.list("sort_order"),
  });

  const openEdit = (b) => {
    setEditing(b.id);
    setForm({
      ...EMPTY, ...b,
      // Синхронизируем _ru с основным если не задан
      title_ru: b.title_ru || b.title || "",
      subtitle_ru: b.subtitle_ru || b.subtitle || "",
      cta_text_ru: b.cta_text_ru || b.cta_text || "",
      badge_text_ru: b.badge_text_ru || b.badge_text || "",
      price_label_ru: b.price_label_ru || b.price_label || "",
    });
    setLangTab("ru");
  };

  const save = async () => {
    if (!form.title_ru && !form.title) { toast.error("Заполните заголовок (хотя бы RU)"); return; }
    const data = {
      ...form,
      title:       form.title_ru || form.title,
      subtitle:    form.subtitle_ru || form.subtitle,
      cta_text:    form.cta_text_ru || form.cta_text,
      badge_text:  form.badge_text_ru || form.badge_text,
      price_label: form.price_label_ru || form.price_label,
    };
    try {
      if (editing === "new") {
        await base44.entities.PromoBanner.create(data);
        toast.success("Баннер создан");
      } else {
        await base44.entities.PromoBanner.update(editing, data);
        toast.success("Баннер обновлён");
      }
      qc.invalidateQueries({ queryKey: ["banners"] });
      qc.invalidateQueries({ queryKey: ["promoBanners"] });
      setEditing(null);
    } catch {
      toast.error("Ошибка сохранения");
      qc.invalidateQueries({ queryKey: ["banners"] });
    }
  };

  const del = async (id) => {
    if (!confirm("Удалить баннер?")) return;
    await base44.entities.PromoBanner.delete(id);
    qc.invalidateQueries({ queryKey: ["banners"] });
    qc.invalidateQueries({ queryKey: ["promoBanners"] });
    toast.success("Удалено");
  };

  const toggle = async (b) => {
    try {
      await base44.entities.PromoBanner.update(b.id, { is_active: !b.is_active });
      qc.invalidateQueries({ queryKey: ["banners"] });
      qc.invalidateQueries({ queryKey: ["promoBanners"] });
    } catch {
      toast.error("Ошибка");
      qc.invalidateQueries({ queryKey: ["banners"] });
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const byType = (type) => banners.filter(b => b.type === type);
  const hasPromoTop = byType("promo_top").length > 0;
  const hasPromoBottom = byType("promo_bottom").length > 0;

  // Показываем нужные языковые поля
  const showSubtitle = ["slider", "promo_top", "promo_bottom"].includes(form.type);
  const showCta      = ["slider", "promo_top", "promo_bottom"].includes(form.type);
  const showBadge    = true;
  const showPrice    = form.type === "promo_top";

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Рекламные баннеры</h1>
          <p className="text-muted-foreground text-sm mt-1">Слайдер, мини-карточки и промо-блоки · RU / KZ / EN</p>
        </div>
        <Button onClick={() => { setEditing("new"); setForm(EMPTY); setLangTab("ru"); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
          <Plus className="h-4 w-4" /> Новый баннер
        </Button>
      </div>

      {/* ── Форма ──────────────────────────────────────────────────────────── */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">{editing === "new" ? "Создать баннер" : "Редактировать баннер"}</h2>
            <LangTabs lang={langTab} onChange={setLangTab} />
          </div>

          {/* Тип */}
          <div className="mb-5">
            <label className="text-xs font-medium text-muted-foreground block mb-2">Тип баннера</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <button key={type} type="button" onClick={() => f("type", type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                    ${form.type === type ? "text-white border-transparent" : "text-foreground border-border hover:bg-secondary"}`}
                  style={form.type === type ? { backgroundColor: "#C0392B" } : {}}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Языковые поля ─────────────────────────────────────────────── */}
          <div className="border border-dashed border-border rounded-xl p-4 bg-secondary/30 mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Текстовый контент · {langTab.toUpperCase()}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <LangInput lang={langTab} form={form} setForm={setForm} field="title"
                  label="Заголовок *" placeholder="Текст\nна двух строках (\\n = перенос)" />
              </div>
              {showSubtitle && (
                <div className="md:col-span-2">
                  <LangInput lang={langTab} form={form} setForm={setForm} field="subtitle"
                    label="Подзаголовок / описание" textarea />
                </div>
              )}
              {showCta && (
                <LangInput lang={langTab} form={form} setForm={setForm} field="cta_text"
                  label="Текст кнопки" placeholder="Смотреть / Қарау / View" />
              )}
              {showBadge && (
                <LangInput lang={langTab} form={form} setForm={setForm} field="badge_text"
                  label="Текст бейджа" placeholder="Акция / Акция / Sale" />
              )}
              {showPrice && (
                <div className="md:col-span-2">
                  <LangInput lang={langTab} form={form} setForm={setForm} field="price_label"
                    label="Подпись цены (promo_top)" placeholder="Металлочерепица от / ... from" />
                </div>
              )}
            </div>
          </div>

          {/* Нелокализованные поля */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Ссылка кнопки</label>
              <Input value={form.cta_link} onChange={e => f("cta_link", e.target.value)} placeholder="/catalog/Кровля" />
            </div>
            {showPrice && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Цена (напр. 1 490 ₸)</label>
                  <Input value={form.price_value} onChange={e => f("price_value", e.target.value)} placeholder="1 490 ₸" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Единица (напр. м²)</label>
                  <Input value={form.price_unit} onChange={e => f("price_unit", e.target.value)} placeholder="м²" />
                </div>
              </>
            )}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-muted-foreground block mb-1">URL изображения</label>
              <Input value={form.image_url} onChange={e => f("image_url", e.target.value)} placeholder="https://..." />
              {form.image_url && <img src={form.image_url} alt="" className="h-20 rounded-lg object-cover mt-2 border border-border" />}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Цвет фона</label>
              <div className="flex gap-2">
                <input type="color" value={form.bg_color} onChange={e => f("bg_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.bg_color} onChange={e => f("bg_color", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Цвет текста</label>
              <div className="flex gap-2">
                <input type="color" value={form.text_color} onChange={e => f("text_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.text_color} onChange={e => f("text_color", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Порядок</label>
              <Input type="number" value={form.sort_order} onChange={e => f("sort_order", Number(e.target.value))} />
            </div>
          </div>

          {/* Превью */}
          {(form[`title_${langTab}`] || form.title) && (
            <div className="mt-5 rounded-xl overflow-hidden" style={{ height: 100, backgroundColor: form.bg_color }}>
              <div className="h-full flex items-center px-6">
                <div>
                  {(form[`title_${langTab}`] || form.title || "").split("\n").map((line, i) => (
                    <p key={i} className="font-bold text-lg leading-tight" style={{ color: form.text_color }}>{line}</p>
                  ))}
                  {(form[`subtitle_${langTab}`] || form.subtitle) && (
                    <p className="text-sm mt-1" style={{ color: form.text_color + "99" }}>{form[`subtitle_${langTab}`] || form.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* ── Таблицы по типам ──────────────────────────────────────────────── */}
      {[
        { type: "slider",       label: "Слайдер (HeroBanner)",                  color: "bg-blue-500" },
        { type: "promo_card",   label: "Мини-карточки (под слайдером)",          color: "bg-orange-400" },
        { type: "promo_top",    label: "Промо «Акция месяца» (PromoBanner top)", color: "bg-red-500" },
        { type: "promo_bottom", label: "Промо-карточки низ (PromoBanner bottom)",color: "bg-purple-500" },
      ].map(({ type, label, color }) => {
        const items = byType(type);
        return (
          <div key={type} className="mb-6">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${color} inline-block`} />
              {label} ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map(b => <BannerRow key={b.id} b={b} onEdit={openEdit} onToggle={toggle} onDelete={del} />)}
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground py-3 px-4 bg-secondary rounded-lg">Нет баннеров этого типа</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BannerRow({ b, onEdit, onToggle, onDelete }) {
  // Показываем наличие переводов
  const hasKz = !!(b.title_kz || b.subtitle_kz || b.cta_text_kz);
  const hasEn = !!(b.title_en || b.subtitle_en || b.cta_text_en);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
      {b.image_url && <img src={b.image_url} alt="" className="h-14 w-20 object-cover rounded-lg border border-border shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{(b.title_ru || b.title || "").replace(/\n/g, " ")}</p>
        {(b.subtitle_ru || b.subtitle) && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{b.subtitle_ru || b.subtitle}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">
            {TYPE_LABELS[b.type] || b.type}
          </span>
          {/* i18n coverage badges */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${b.title_ru ? "bg-blue-100 text-blue-700" : "bg-secondary text-muted-foreground/40"}`}>RU</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${hasKz ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground/40"}`}>KZ</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${hasEn ? "bg-yellow-100 text-yellow-700" : "bg-secondary text-muted-foreground/40"}`}>EN</span>
          {b.cta_text_ru && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">«{b.cta_text_ru}»</span>}
          {b.badge_text_ru && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">{b.badge_text_ru}</span>}
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-secondary text-muted-foreground"}`}>
            {b.is_active ? "Активен" : "Скрыт"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onToggle(b)}>{b.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(b)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
