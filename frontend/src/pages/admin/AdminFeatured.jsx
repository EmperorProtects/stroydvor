import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, X } from "lucide-react";
import { toast } from "sonner";

const empty = { section_title: "", product_ids: [], is_active: true, sort_order: 0 };

export default function AdminFeatured() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [productSearch, setProductSearch] = useState("");

  const { data: sections = [] } = useQuery({ queryKey: ["featuredSections"], queryFn: () => base44.entities.FeaturedSection.list("sort_order") });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list("-created_date", 500) });

  const save = async () => {
    if (!form.section_title) { toast.error("Введите название секции"); return; }
    if (editing === "new") {
      await base44.entities.FeaturedSection.create(form);
      toast.success("Секция создана");
    } else {
      await base44.entities.FeaturedSection.update(editing, form);
      toast.success("Обновлено");
    }
    qc.invalidateQueries({ queryKey: ["featuredSections"] });
    setEditing(null);
    setForm(empty);
  };

  const del = async (id) => {
    if (!confirm("Удалить секцию?")) return;
    await base44.entities.FeaturedSection.delete(id);
    qc.invalidateQueries({ queryKey: ["featuredSections"] });
  };

  const toggle = async (s) => {
    await base44.entities.FeaturedSection.update(s.id, { is_active: !s.is_active });
    qc.invalidateQueries({ queryKey: ["featuredSections"] });
  };

  const toggleProduct = (pid) => {
    const ids = form.product_ids || [];
    if (ids.includes(pid)) {
      setForm({ ...form, product_ids: ids.filter(i => i !== pid) });
    } else {
      setForm({ ...form, product_ids: [...ids, pid] });
    }
  };

  const filteredProducts = products.filter(p => !productSearch || p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.category?.toLowerCase().includes(productSearch.toLowerCase()));
  const selectedProducts = products.filter(p => (form.product_ids || []).includes(p.id));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Рекомендуемые секции</h1>
          <p className="text-gray-500 text-sm mt-1">Блоки товаров на главной странице с прокруткой</p>
        </div>
        <Button onClick={() => { setEditing("new"); setForm(empty); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
          <Plus className="h-4 w-4" /> Новая секция
        </Button>
      </div>

      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 text-sm">
        <p className="font-semibold text-green-800 dark:text-green-300 mb-1">💡 Как работают секции</p>
        <p className="text-green-700 dark:text-green-400">Каждая секция — это блок на главной странице с названием (например "Всё для Дачи и Дома") и товарами. Товары прокручиваются вправо, по 4 карточки в одном виде. Вы можете добавить любое количество товаров.</p>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editing === "new" ? "Новая секция" : "Редактировать секцию"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Название секции *</label>
              <Input value={form.section_title} onChange={e => setForm({ ...form, section_title: e.target.value })} placeholder="Всё для Дачи и Дома" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Порядок сортировки</label>
              <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Выбранные товары: <span className="font-bold text-[#C0392B]">{(form.product_ids || []).length}</span>
            </label>
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedProducts.map(p => (
                  <span key={p.id} className="flex items-center gap-1 bg-secondary text-xs px-2 py-1 rounded-full">
                    {p.title}
                    <button onClick={() => toggleProduct(p.id)}><X className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-9 h-8 text-sm" placeholder="Поиск товаров..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
            </div>
            <div className="max-h-56 overflow-y-auto border border-border rounded-lg">
              {filteredProducts.slice(0, 50).map(p => {
                const selected = (form.product_ids || []).includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggleProduct(p.id)} className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors border-b border-border last:border-0 ${selected ? "bg-red-50 dark:bg-red-950" : "hover:bg-secondary"}`}>
                    <div className={`h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center ${selected ? "bg-[#C0392B] border-[#C0392B]" : "border-muted-foreground"}`}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · {(p.price || 0).toLocaleString("ru-RU")} ₸</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sections.map(s => {
          const sProds = products.filter(p => (s.product_ids || []).includes(p.id));
          return (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{s.section_title}</p>
                  <p className="text-sm text-muted-foreground">{(s.product_ids || []).length} товаров</p>
                  {sProds.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {sProds.slice(0, 6).map(p => p.image && <img key={p.id} src={p.image} alt="" className="h-8 w-8 rounded object-cover border border-border" />)}
                      {sProds.length > 6 && <span className="h-8 w-8 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground">+{sProds.length - 6}</span>}
                    </div>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-secondary text-muted-foreground"}`}>{s.is_active ? "Активна" : "Скрыта"}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggle(s)}>{s.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(s.id); setForm({ ...s }); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          );
        })}
        {sections.length === 0 && <p className="text-center py-10 text-muted-foreground">Секций пока нет</p>}
      </div>
    </div>
  );
}