import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Download, Search, FileSpreadsheet, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LangTabs, LangField } from "@/components/ui/LangTabs";

const UNITS = ["шт", "м²", "м³", "кг", "м.п.", "уп"];

const empty = {
  external_id: "", title: "",
  title_ru: "", title_kz: "", title_en: "",
  description: "", description_ru: "", description_kz: "", description_en: "",
  seo_title: "", seo_title_ru: "", seo_title_kz: "", seo_title_en: "",
  seo_description: "", seo_description_ru: "", seo_description_kz: "", seo_description_en: "",
  keywords: "", keywords_ru: "", keywords_kz: "", keywords_en: "",
  price: "", old_price: "", quantity: "", warehouse_category: "",
  category: "", unit: "шт", brand: "", image: "",
  in_stock: true, is_featured: false, is_sale: false
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [langTab, setLangTab] = useState("ru");   // активный язык в форме
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const importRef = useRef(null);
  const updateRef = useRef(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 2000)
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order")
  });

  const topLevelCats = dbCategories.filter(c => c.is_active !== false && !c.parent_category).map(c => c.name);

  const filtered = products.filter(p =>
    !search ||
    [p.title, p.title_ru, p.title_kz, p.title_en,
     p.external_id, p.brand, p.category]
      .filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      ...empty, ...p,
      price:     p.price?.toString()     ?? "",
      old_price: p.old_price?.toString() ?? "",
      quantity:  p.quantity?.toString()  ?? "",
      // если старые данные без i18n полей — синхронизируем из основного
      title_ru: p.title_ru || p.title || "",
      description_ru: p.description_ru || p.description || "",
      seo_title_ru: p.seo_title_ru || p.seo_title || "",
      seo_description_ru: p.seo_description_ru || p.seo_description || "",
      keywords_ru: p.keywords_ru || p.keywords || "",
    });
    setLangTab("ru");
  };

  const save = async () => {
    if (!form.title_ru && !form.title) { toast.error("Заполните название (хотя бы на RU)"); return; }
    if (!form.price || !form.category) { toast.error("Заполните цену и категорию"); return; }

    const data = {
      ...form,
      // Синхронизируем основное поле с RU
      title: form.title_ru || form.title,
      description: form.description_ru || form.description,
      seo_title: form.seo_title_ru || form.seo_title,
      seo_description: form.seo_description_ru || form.seo_description,
      keywords: form.keywords_ru || form.keywords,
      price:     Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : undefined,
      quantity:  form.quantity !== "" ? Number(form.quantity) : 0
    };

    if (editing === "new") {
      await base44.entities.Product.create(data);
      toast.success("Товар создан");
    } else {
      await base44.entities.Product.update(editing, data);
      toast.success("Товар обновлён");
    }
    qc.invalidateQueries({ queryKey: ["products"] });
    setEditing(null);
  };

  const del = async (id) => {
    if (!confirm("Удалить товар?")) return;
    await base44.entities.Product.delete(id);
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success("Удалено");
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Удалить ${selected.size} товар(ов)?`)) return;
    await Promise.all([...selected].map(id => base44.entities.Product.delete(id)));
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success(`Удалено ${selected.size} товаров`);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  // ── CSV helpers ──────────────────────────────────────────────────────────
  const parseFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { resolve([]); return; }
        const delim = lines[0].includes(";") ? ";" : "\t";
        const parseLine = (line) => {
          const result = []; let cur = "", inQuote = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { if (inQuote && line[i + 1] === '"') { cur += '"'; i++; } else inQuote = !inQuote; }
            else if (ch === delim && !inQuote) { result.push(cur.trim()); cur = ""; }
            else cur += ch;
          }
          result.push(cur.trim()); return result;
        };
        const headers = parseLine(lines[0]);
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim() || lines[i].startsWith("#")) continue;
          const values = parseLine(lines[i]);
          const row = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
          rows.push(row);
        }
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsText(file, "UTF-8");
  });

  const normalizeRow = (row) => {
    const title_ru = row["title_ru"] || row["title"] || row["Название товара"] || "";
    const title_kz = row["title_kz"] || "";
    const title_en = row["title_en"] || "";
    const external_id = String(row["external_id"] || row["Артикул"] || "");
    const seo_title_ru = row["seo_title_ru"] || row["seo_title"] || "";
    const description_ru = row["description_ru"] || row["description"] || "";
    const brand = row["brand"] || "";
    const warehouse_category = row["warehouse_category"] || row["Категория Kaspi"] || "";
    const image = row["image"] || "";
    const unit = row["unit"] || "шт";
    const rawCat = row["category"] || "Другие";
    const category = rawCat || "Другие";
    const price = parseFloat(String(row["price"] || "0").replace(",", ".")) || 0;
    const old_price = parseFloat(String(row["old_price"] || "").replace(",", ".")) || undefined;
    const quantity = parseInt(String(row["quantity"] || "0"), 10) || 0;
    const in_stock = String(row["in_stock"] || "TRUE").toUpperCase() !== "FALSE";
    const is_sale = String(row["is_sale"] || "FALSE").toUpperCase() === "TRUE";
    return {
      external_id, title: title_ru, title_ru, title_kz, title_en,
      description: description_ru, description_ru,
      seo_title: seo_title_ru, seo_title_ru,
      price, old_price, quantity, warehouse_category, category, image, unit, brand, in_stock, is_sale
    };
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    toast.info("Читаем файл...");
    try {
      const rawRows = await parseFile(file);
      const rows = rawRows.map(normalizeRow).filter(r => r.title && r.price > 0);
      if (rows.length === 0) { toast.error("Не найдено товаров. Проверьте файл."); setImporting(false); return; }
      toast.info(`Найдено ${rows.length} товаров, загружаем...`);
      let created = 0;
      for (let i = 0; i < rows.length; i += 5) {
        const batch = rows.slice(i, i + 5);
        await Promise.all(batch.map(row => base44.entities.Product.create(row)));
        created += batch.length;
      }
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(`✅ Импортировано ${created} товаров`);
    } catch (err) { toast.error("Ошибка: " + err.message); }
    setImporting(false);
  };

  const handleStockUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setUpdating(true);
    toast.info("Читаем файл...");
    try {
      const rawRows = await parseFile(file);
      const rows = rawRows.map(normalizeRow).filter(r => r.external_id || r.title);
      if (rows.length === 0) { toast.error("Файл пустой или неверный формат."); setUpdating(false); return; }
      toast.info(`Обрабатываем ${rows.length} строк...`);
      let updated = 0, created = 0, skipped = 0;
      for (const row of rows) {
        const existing = products.find(p =>
          (row.external_id && p.external_id === row.external_id) ||
          (!row.external_id && p.title === row.title)
        );
        if (existing) {
          await base44.entities.Product.update(existing.id, {
            price: row.price || existing.price,
            old_price: row.old_price ?? existing.old_price,
            quantity: row.quantity ?? existing.quantity,
            in_stock: row.quantity > 0,
            image: row.image || existing.image,
            category: row.category !== "Другие" ? row.category : existing.category,
          });
          updated++;
        } else if (row.title && row.price > 0) {
          await base44.entities.Product.create(row); created++;
        } else { skipped++; }
      }
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(`✅ Обновлено: ${updated}, добавлено: ${created}, пропущено: ${skipped}`);
    } catch (err) { toast.error("Ошибка: " + err.message); }
    setUpdating(false);
  };

  const downloadTemplate = () => {
    const headers = [
      "external_id","title_ru","title_kz","title_en",
      "description_ru","description_kz","description_en",
      "seo_title_ru","seo_title_kz","seo_title_en",
      "keywords_ru","keywords_kz","keywords_en",
      "price","old_price","quantity","category","image","unit","brand","in_stock","is_sale"
    ];
    const examples = [
      ["SKU-001","Металлочерепица Монтеррей 0.5мм","МП Монтерей 0.5 мм металл черепица","Metal Roof Tile Monterrey 0.5mm",
       "Описание на русском","Қазақша сипаттама","Description in English",
       "Металлочерепица купить Астана","Металл черепица Астана","Metal tiles Astana buy",
       "металлочерепица Астана","металл черепица","metal tiles",
       "2500","3000","150","Кровля","https://example.com/img.jpg","м²","Grand Line","TRUE","FALSE"],
    ];
    const csv = [headers, ...examples].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "шаблон_товары_i18n.csv"; a.click();
  };

  return (
    <div className="p-8 max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Товары</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} товаров · поддержка RU / KZ / EN</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2 text-sm">
            <Download className="h-4 w-4" /> Шаблон (CSV, i18n)
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()} disabled={importing} className="gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4" /> {importing ? "Импорт..." : "Импорт (CSV)"}
          </Button>
          <Button variant="outline" onClick={() => updateRef.current?.click()} disabled={updating} className="gap-2 text-sm border-green-300 text-green-700 hover:bg-green-50">
            <RefreshCw className="h-4 w-4" /> {updating ? "Обновление..." : "Обновить склад"}
          </Button>
          <input ref={importRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleImport} />
          <input ref={updateRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleStockUpdate} />
          <Button onClick={() => { setEditing("new"); setForm(empty); setLangTab("ru"); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
            <Plus className="h-4 w-4" /> Добавить товар
          </Button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">{editing === "new" ? "Новый товар" : "Редактировать товар"}</h2>
            <LangTabs lang={langTab} onChange={setLangTab} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Технические поля (без i18n) */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Код товара (Мой Склад)</label>
              <Input value={form.external_id} onChange={e => setForm({ ...form, external_id: e.target.value })} placeholder="SKU-001" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Цена * (₸)</label>
              <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Старая цена (₸)</label>
              <Input type="number" value={form.old_price} onChange={e => setForm({ ...form, old_price: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Количество на складе</label>
              <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Категория из Мой Склад</label>
              <Input value={form.warehouse_category} onChange={e => setForm({ ...form, warehouse_category: e.target.value })} placeholder="Кровля (МС)" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Категория на сайте *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground">
                <option value="">— Выберите —</option>
                {topLevelCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">URL фото</label>
              <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Бренд</label>
              <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Единица измерения</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* ── Языковые поля ───────────────────────────────────────── */}
          <div className="mt-5 p-4 border border-dashed border-border rounded-xl bg-secondary/30">
            <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Контент · {langTab.toUpperCase()}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LangField lang={langTab} form={form} setForm={setForm} field="title" label="Название" required />
              <LangField lang={langTab} form={form} setForm={setForm} field="seo_title" label="SEO заголовок" />
              <div className="md:col-span-2">
                <LangField lang={langTab} form={form} setForm={setForm} field="description" label="Описание" multiline rows={3} />
              </div>
              <LangField lang={langTab} form={form} setForm={setForm} field="seo_description" label="SEO описание" multiline rows={2} />
              <LangField lang={langTab} form={form} setForm={setForm} field="keywords" label="Ключевые слова" />
            </div>
          </div>

          {/* Флаги */}
          <div className="flex gap-6 flex-wrap mt-4">
            {[["in_stock","В наличии"],["is_featured","Рекомендуемый"],["is_sale","Распродажа"]].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form[k]} onChange={e => setForm({ ...form, [k]: e.target.checked })} className="rounded" />
                {label}
              </label>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
          <span className="text-sm font-medium text-red-800 dark:text-red-300">Выбрано: {selected.size}</span>
          <Button size="sm" onClick={deleteSelected} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Trash2 className="h-3.5 w-3.5" /> Удалить выбранные
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>Снять выбор</Button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Поиск по названию (RU/KZ/EN), коду, бренду, категории..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} className="rounded cursor-pointer" />
              </th>
              {["Код","Товар (RU)","KZ","EN","Категория","Цена","Остаток","Статус",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={10} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.map((p) => (
              <tr key={p.id} className={`border-b border-border hover:bg-secondary transition-colors ${selected.has(p.id) ? "bg-red-50 dark:bg-red-950" : ""}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded cursor-pointer" />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{p.external_id || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image && <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover border border-border shrink-0" />}
                    <div>
                      <p className="font-medium line-clamp-1">{p.title_ru || p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px]">
                  <p className="line-clamp-2">{p.title_kz || <span className="opacity-40">—</span>}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px]">
                  <p className="line-clamp-2">{p.title_en || <span className="opacity-40">—</span>}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{p.category}</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{(p.price || 0).toLocaleString("ru-RU")} ₸</td>
                <td className="px-4 py-3 text-center text-sm">{p.quantity ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.in_stock ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"}`}>
                    {p.in_stock ? "В наличии" : "Нет"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <p className="text-center py-10 text-muted-foreground">Товары не найдены</p>}
      </div>
    </div>
  );
}
