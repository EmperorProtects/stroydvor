import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const empty = {
  type: "slider",
  title: "",
  subtitle: "",
  cta_text: "Смотреть",
  cta_link: "/catalog",
  badge_text: "",
  image_url: "",
  bg_color: "#1a3a2a",
  text_color: "#ffffff",
  is_active: true,
  sort_order: 0,
};

export default function AdminBanners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: () => base44.entities.PromoBanner.list("sort_order"),
  });

  const save = async () => {
    if (!form.title) { toast.error("Введите заголовок"); return; }
    try {
      if (editing === "new") {
        await base44.entities.PromoBanner.create(form);
        toast.success("Баннер создан");
      } else {
        await base44.entities.PromoBanner.update(editing, form);
        toast.success("Баннер обновлён");
      }
      qc.invalidateQueries({ queryKey: ["banners"] });
      qc.invalidateQueries({ queryKey: ["promoBanners"] });
      setEditing(null);
      setForm(empty);
    } catch (err) {
      toast.error("Ошибка: баннер не найден или был удалён");
      qc.invalidateQueries({ queryKey: ["banners"] });
      setEditing(null);
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
      toast.error("Ошибка: баннер не найден");
      qc.invalidateQueries({ queryKey: ["banners"] });
    }
  };

  const openEdit = (b) => { setEditing(b.id); setForm({ ...b }); };
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const sliders = banners.filter(b => b.type === "slider");
  const promoCards = banners.filter(b => b.type === "promo_card");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Рекламные баннеры</h1>
          <p className="text-muted-foreground text-sm mt-1">Слайдер и мини-карточки на главной странице</p>
        </div>
        <Button onClick={() => { setEditing("new"); setForm(empty); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
          <Plus className="h-4 w-4" /> Новый баннер
        </Button>
      </div>

      {/* Form */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editing === "new" ? "Создать баннер" : "Редактировать баннер"}</h2>

          {/* Type selector */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground block mb-2">Тип баннера</label>
            <div className="flex gap-3">
              <button
                onClick={() => f("type", "slider")}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === "slider" ? "text-white border-transparent" : "text-foreground border-border hover:bg-secondary"}`}
                style={form.type === "slider" ? { backgroundColor: "#C0392B" } : {}}
              >
                Слайдер (главный)
              </button>
              <button
                onClick={() => f("type", "promo_card")}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === "promo_card" ? "text-white border-transparent" : "text-foreground border-border hover:bg-secondary"}`}
                style={form.type === "promo_card" ? { backgroundColor: "#C0392B" } : {}}
              >
                Мини-карточка
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Заголовок (большой текст) *
                <span className="text-muted-foreground font-normal ml-1">— используйте \n для переноса строки</span>
              </label>
              <Input value={form.title} onChange={e => f("title", e.target.value)} placeholder="Кровельные материалы\nсо скидкой до 30%" />
            </div>

            {form.type === "slider" && (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Подзаголовок (маленький текст)</label>
                <Input value={form.subtitle} onChange={e => f("subtitle", e.target.value)} placeholder="металлочерепица, профнастил, водосток" />
              </div>
            )}

            {form.type === "slider" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Текст кнопки</label>
                  <Input value={form.cta_text} onChange={e => f("cta_text", e.target.value)} placeholder="Смотреть" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Ссылка кнопки</label>
                  <Input value={form.cta_link} onChange={e => f("cta_link", e.target.value)} placeholder="/catalog" />
                </div>
              </>
            )}

            {form.type === "promo_card" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Текст бейджа (напр. -20%)</label>
                  <Input value={form.badge_text} onChange={e => f("badge_text", e.target.value)} placeholder="-20%" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Ссылка при клике</label>
                  <Input value={form.cta_link} onChange={e => f("cta_link", e.target.value)} placeholder="/catalog" />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">URL изображения</label>
              <Input value={form.image_url} onChange={e => f("image_url", e.target.value)} placeholder="https://..." />
              {form.image_url && <img src={form.image_url} alt="" className="h-20 rounded-lg object-cover mt-2 border border-border" />}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Цвет фона</label>
              <div className="flex gap-2">
                <input type="color" value={form.bg_color} onChange={e => f("bg_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.bg_color} onChange={e => f("bg_color", e.target.value)} placeholder="#1a3a2a" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Цвет текста</label>
              <div className="flex gap-2">
                <input type="color" value={form.text_color} onChange={e => f("text_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.text_color} onChange={e => f("text_color", e.target.value)} placeholder="#ffffff" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Порядок сортировки</label>
              <Input type="number" value={form.sort_order} onChange={e => f("sort_order", Number(e.target.value))} />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* Slider banners */}
      <div className="mb-6">
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Слайдер ({sliders.length})
        </h2>
        <div className="space-y-3">
          {sliders.map((b) => <BannerRow key={b.id} b={b} onEdit={openEdit} onToggle={toggle} onDelete={del} />)}
          {sliders.length === 0 && <p className="text-sm text-muted-foreground py-3 px-4 bg-secondary rounded-lg">Нет слайдов</p>}
        </div>
      </div>

      {/* Promo cards */}
      <div>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
          Мини-карточки ({promoCards.length})
        </h2>
        <div className="space-y-3">
          {promoCards.map((b) => <BannerRow key={b.id} b={b} onEdit={openEdit} onToggle={toggle} onDelete={del} />)}
          {promoCards.length === 0 && <p className="text-sm text-muted-foreground py-3 px-4 bg-secondary rounded-lg">Нет карточек</p>}
        </div>
      </div>
    </div>
  );
}

function BannerRow({ b, onEdit, onToggle, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
      {b.image_url && <img src={b.image_url} alt="" className="h-14 w-20 object-cover rounded-lg border border-border shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{b.title?.replace(/\n/g, " ")}</p>
        {b.subtitle && <p className="text-sm text-muted-foreground truncate">{b.subtitle}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: b.bg_color || "#eee", color: b.text_color || "#333" }}>
            {b.type === "slider" ? "Слайдер" : "Карточка"}
          </span>
          {b.cta_text && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Кнопка: «{b.cta_text}»</span>}
          {b.badge_text && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">{b.badge_text}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-secondary text-muted-foreground"}`}>
            {b.is_active ? "Активен" : "Скрыт"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onToggle(b)}>{b.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(b)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}