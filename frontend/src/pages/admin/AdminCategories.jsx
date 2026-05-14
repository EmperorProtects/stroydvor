import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, ChevronRight, ChevronDown, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LangTabs, LangField } from "@/components/ui/LangTabs";

const EMPTY = {
  name: "", name_ru: "", name_kz: "", name_en: "",
  parent_category: "", icon: "", image_url: "", sort_order: 0, is_active: true,
  seo_title: "", seo_title_ru: "", seo_title_kz: "", seo_title_en: "",
  seo_description: "", seo_description_ru: "", seo_description_kz: "", seo_description_en: "",
  keywords: "", keywords_ru: "", keywords_kz: "", keywords_en: "",
};

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines  = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const delim = lines[0].includes(",") ? "," : "\t";
  const parseLine = (line) => {
    const result = []; let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === delim && !inQ) { result.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    result.push(cur.trim()); return result;
  };
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  return lines.slice(1)
    .map(line => {
      const vals = parseLine(line);
      const obj  = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
      return obj;
    })
    .filter(row => Object.values(row).some(v => v));
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsText(file, "UTF-8");
  });
}

function downloadTemplate() {
  const headers = [
    "name_ru","name_kz","name_en","parent_category","icon","image_url",
    "seo_title_ru","seo_title_kz","seo_title_en",
    "seo_description_ru","seo_description_kz","seo_description_en",
    "keywords_ru","keywords_kz","keywords_en",
    "sort_order","is_active"
  ];
  const rows = [
    ["Кровля","Шатыр материалдары","Roofing","","🏠","",
     "Кровельные материалы Астана","Шатыр материалдары Астана","Roofing Astana",
     "Металлочерепица, профнастил","Металл черепица, профнастил","Metal tiles, corrugated",
     "кровля астана","шатыр астана","roofing astana","1","TRUE"],
    ["Металлочерепица","Металл черепица","Metal Tiles","Кровля","","",
     "Металлочерепица купить","Металл черепица","Buy metal tiles",
     "","","","","","","1","TRUE"],
  ];
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "шаблон_категории_i18n.csv"; a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const importRef = useRef(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [langTab, setLangTab] = useState("ru");
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [importing, setImporting] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn:  () => base44.entities.Category.list("sort_order"),
  });

  const topLevel    = categories.filter(c => !c.parent_category).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const getChildren = (parentName) => categories.filter(c => c.parent_category === parentName).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const toggleExpand = (name) => setExpandedParents(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const openEdit = (cat) => {
    setEditing(cat.id);
    setForm({
      ...EMPTY, ...cat,
      // Синхронизируем если старые данные без i18n
      name_ru: cat.name_ru || cat.name || "",
      seo_title_ru: cat.seo_title_ru || cat.seo_title || "",
      seo_description_ru: cat.seo_description_ru || cat.seo_description || "",
      keywords_ru: cat.keywords_ru || cat.keywords || "",
    });
    setLangTab("ru");
  };

  const save = async () => {
    if (!form.name_ru && !form.name) { toast.error("Укажите название хотя бы на RU"); return; }
    const data = {
      ...form,
      name: form.name_ru || form.name,
      seo_title: form.seo_title_ru || form.seo_title,
      seo_description: form.seo_description_ru || form.seo_description,
      keywords: form.keywords_ru || form.keywords,
      sort_order: Number(form.sort_order) || 0,
      is_active: !!form.is_active,
    };
    if (editing === "new") {
      await base44.entities.Category.create(data);
      toast.success("Категория создана");
    } else {
      await base44.entities.Category.update(editing, data);
      toast.success("Категория обновлена");
    }
    qc.invalidateQueries({ queryKey: ["categories"] });
    setEditing(null);
  };

  const del = async (id) => {
    if (!confirm("Удалить категорию?")) return;
    await base44.entities.Category.delete(id);
    qc.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Удалено");
  };

  const toggleActive = async (cat) => {
    await base44.entities.Category.update(cat.id, { is_active: !cat.is_active });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const moveOrder = async (cat, dir) => {
    const siblings = cat.parent_category
      ? getChildren(cat.parent_category)
      : topLevel;
    const idx = siblings.findIndex(c => c.id === cat.id);
    const target = siblings[idx + dir];
    if (!target) return;
    await Promise.all([
      base44.entities.Category.update(cat.id,    { sort_order: target.sort_order }),
      base44.entities.Category.update(target.id, { sort_order: cat.sort_order }),
    ]);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const text = await readFile(file);
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error("Файл пустой или неверный формат"); setImporting(false); return; }

      const topNames = new Set(categories.filter(c => !c.parent_category).map(c => c.name_ru || c.name));
      let created = 0;
      for (const row of rows) {
        const name_ru = row["name_ru"] || row["name"] || "";
        if (!name_ru) continue;
        const data = {
          name: name_ru, name_ru,
          name_kz: row["name_kz"] || "",
          name_en: row["name_en"] || "",
          parent_category: row["parent_category"] || null,
          icon: row["icon"] || "📦",
          image_url: row["image_url"] || "",
          sort_order: parseInt(row["sort_order"] || "0", 10) || 0,
          is_active: String(row["is_active"] || "TRUE").toUpperCase() !== "FALSE",
          seo_title: row["seo_title_ru"] || "",
          seo_title_ru: row["seo_title_ru"] || "",
          seo_title_kz: row["seo_title_kz"] || "",
          seo_title_en: row["seo_title_en"] || "",
          seo_description: row["seo_description_ru"] || "",
          seo_description_ru: row["seo_description_ru"] || "",
          seo_description_kz: row["seo_description_kz"] || "",
          seo_description_en: row["seo_description_en"] || "",
          keywords: row["keywords_ru"] || "",
          keywords_ru: row["keywords_ru"] || "",
          keywords_kz: row["keywords_kz"] || "",
          keywords_en: row["keywords_en"] || "",
        };
        await base44.entities.Category.create(data);
        created++;
      }
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(`✅ Создано ${created} категорий`);
    } catch (err) {
      toast.error("Ошибка: " + err.message);
    }
    setImporting(false);
  };

  const CatRow = ({ cat, level = 0 }) => {
    const children = getChildren(cat.name_ru || cat.name);
    const isExpanded = expandedParents.has(cat.name_ru || cat.name);
    return (
      <>
        <tr className={`border-b border-border hover:bg-secondary transition-colors ${!cat.is_active ? "opacity-50" : ""}`}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {children.length > 0 ? (
                <button onClick={() => toggleExpand(cat.name_ru || cat.name)} className="text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : <span className="w-4" />}
              <span className="text-lg">{cat.icon || "📦"}</span>
              <div>
                <p className="font-medium text-sm">{cat.name_ru || cat.name}</p>
                {(cat.name_kz || cat.name_en) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {cat.name_kz && <span className="mr-2">🇰🇿 {cat.name_kz}</span>}
                    {cat.name_en && <span>🇬🇧 {cat.name_en}</span>}
                  </p>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-xs text-muted-foreground">{cat.parent_category || <span className="italic">верхний уровень</span>}</td>
          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{cat.slug}</td>
          <td className="px-4 py-3 text-xs text-center">{cat.sort_order}</td>
          <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
            {cat.seo_title_ru || cat.seo_title
              ? <span className="text-green-600 dark:text-green-400">✓ {(cat.seo_title_ru || cat.seo_title || "").substring(0, 40)}…</span>
              : <span className="opacity-40">—</span>}
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => moveOrder(cat, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => moveOrder(cat,  1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => toggleActive(cat)}>
                {cat.is_active ? <Eye className="h-3.5 w-3.5 text-green-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(cat.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </td>
        </tr>
        {isExpanded && children.map(child => <CatRow key={child.id} cat={child} level={level + 1} />)}
      </>
    );
  };

  return (
    <div className="p-8 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Категории</h1>
          <p className="text-muted-foreground text-sm mt-1">{categories.length} категорий · RU / KZ / EN</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2 text-sm">
            <Download className="h-4 w-4" /> Шаблон (i18n)
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()} disabled={importing} className="gap-2 text-sm">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            {importing ? "Импорт..." : "Импорт CSV"}
          </Button>
          <input ref={importRef} type="file" accept=".csv,.tsv" className="hidden" onChange={handleImport} />
          <Button onClick={() => { setEditing("new"); setForm(EMPTY); setLangTab("ru"); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
            <Plus className="h-4 w-4" /> Добавить категорию
          </Button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">{editing === "new" ? "Новая категория" : "Редактировать категорию"}</h2>
            <LangTabs lang={langTab} onChange={setLangTab} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {/* Технические поля */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Родительская категория</label>
              <select value={form.parent_category} onChange={e => setForm({ ...form, parent_category: e.target.value })} className="w-full h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground">
                <option value="">— Верхний уровень —</option>
                {topLevel.map(c => <option key={c.id} value={c.name_ru || c.name}>{c.icon} {c.name_ru || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Иконка (emoji)</label>
              <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🏠" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">URL изображения</label>
              <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Порядок сортировки</label>
              <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Активна
              </label>
            </div>
          </div>

          {/* Языковые поля */}
          <div className="p-4 border border-dashed border-border rounded-xl bg-secondary/30">
            <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Контент · {langTab.toUpperCase()}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LangField lang={langTab} form={form} setForm={setForm} field="name" label="Название категории" required />
              <LangField lang={langTab} form={form} setForm={setForm} field="seo_title" label="SEO заголовок" />
              <div className="md:col-span-2">
                <LangField lang={langTab} form={form} setForm={setForm} field="seo_description" label="SEO описание" multiline rows={2} />
              </div>
              <LangField lang={langTab} form={form} setForm={setForm} field="keywords" label="Ключевые слова" />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {["Категория (RU / KZ / EN)","Родитель","Slug","Порядок","SEO",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td></tr>
              ))
            ) : topLevel.map(cat => <CatRow key={cat.id} cat={cat} level={0} />)}
          </tbody>
        </table>
        {!isLoading && topLevel.length === 0 && <p className="text-center py-10 text-muted-foreground">Категорий нет</p>}
      </div>
    </div>
  );
}
