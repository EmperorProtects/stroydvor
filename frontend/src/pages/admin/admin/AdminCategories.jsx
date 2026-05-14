import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff,
  ChevronRight, ChevronDown, Download, FileSpreadsheet, Loader2, FolderOpen, Folder
} from "lucide-react";
import { toast } from "sonner";

const empty = { name: "", parent_category: "", image_url: "", sort_order: 0, is_active: true, icon: "" };

// ─── CSV helpers ──────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const delim = lines[0].includes(";") ? ";" : "\t";
  const parseLine = (line) => {
    const result = []; let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === delim && !inQ) { result.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
}

// ─── Tree builder ─────────────────────────────────────────────────────────────
function buildTree(categories) {
  const byName = {};
  categories.forEach(c => { byName[c.name] = c; });
  const topLevel = categories
    .filter(c => !c.parent_category)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  function getChildren(parentName, depth = 0) {
    if (depth > 5) return []; // prevent infinite loops
    return categories
      .filter(c => c.parent_category === parentName)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(c => ({ ...c, children: getChildren(c.name, depth + 1) }));
  }
  return topLevel.map(c => ({ ...c, children: getChildren(c.name) }));
}

// ─── Tree row component ───────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, onEdit, onDel, onMove, onToggle, expanded, setExpanded }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const indent = depth * 20;

  return (
    <>
      <tr className={`border-b border-border hover:bg-secondary/50 transition-colors ${!node.is_active ? "opacity-50" : ""}`}>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1" style={{ paddingLeft: indent }}>
            {hasChildren ? (
              <button onClick={() => setExpanded(prev => {
                const next = new Set(prev);
                next.has(node.id) ? next.delete(node.id) : next.add(node.id);
                return next;
              })} className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="h-5 w-5 flex items-center justify-center text-muted-foreground/40 shrink-0">
                {depth > 0 ? <ChevronRight className="h-3 w-3" /> : null}
              </span>
            )}
            {node.image_url
              ? <img src={node.image_url} alt="" className="h-7 w-7 rounded object-cover border border-border shrink-0" />
              : <span className="text-lg shrink-0">{node.icon || (depth === 0 ? "📁" : "📂")}</span>
            }
            <span className={`font-medium text-sm ml-1 ${depth === 0 ? "text-foreground" : "text-muted-foreground"}`}>
              {node.name}
            </span>
            {hasChildren && (
              <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full ml-1">
                {node.children.length}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">
          {node.parent_category || <span className="text-[#C0392B] font-medium">Главная</span>}
        </td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground text-center">{node.sort_order || 0}</td>
        <td className="px-3 py-2.5">
          <span className={`text-xs px-2 py-0.5 rounded-full ${node.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-secondary text-muted-foreground"}`}>
            {node.is_active ? "Активна" : "Скрыта"}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-0.5 justify-end">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(node, "up")} title="Вверх"><ArrowUp className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(node, "down")} title="Вниз"><ArrowDown className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(node)} title={node.is_active ? "Скрыть" : "Показать"}>
              {node.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(node)} title="Редактировать"><Pencil className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDel(node)} title="Удалить"><Trash2 className="h-3 w-3" /></Button>
          </div>
        </td>
      </tr>
      {/* Render children recursively */}
      {hasChildren && isExpanded && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1}
          onEdit={onEdit} onDel={onDel} onMove={onMove} onToggle={onToggle}
          expanded={expanded} setExpanded={setExpanded} />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(empty);
  const [expanded, setExpanded]   = useState(new Set());
  const [importing, setImporting] = useState(false);
  const importRef = useRef(null);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  // All categories usable as parents (any level)
  const allCats = categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const topLevel = allCats.filter(c => !c.parent_category);
  const tree = buildTree(allCats);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.name.trim()) { toast.error("Введите название"); return; }
    const data = { ...form, parent_category: form.parent_category || null };
    try {
      if (editing === "new") {
        await base44.entities.Category.create(data);
        toast.success("Категория создана");
      } else {
        await base44.entities.Category.update(editing, data);
        toast.success("Сохранено");
      }
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null); setForm(empty);
    } catch (e) { toast.error(e.message || "Ошибка"); }
  };

  const del = async (node) => {
    const hasChildren = categories.some(c => c.parent_category === node.name);
    if (hasChildren) {
      if (!confirm(`У категории «${node.name}» есть подкатегории. Удалить вместе с ними?`)) return;
      // Recursively collect all descendants
      const toDelete = [];
      const collect = (name) => {
        categories.filter(c => c.parent_category === name).forEach(c => { collect(c.name); toDelete.push(c.id); });
      };
      collect(node.name);
      toDelete.push(node.id);
      await Promise.all(toDelete.map(id => base44.entities.Category.delete(id)));
      toast.success(`Удалено ${toDelete.length} записей`);
    } else {
      if (!confirm(`Удалить «${node.name}»?`)) return;
      await base44.entities.Category.delete(node.id);
      toast.success("Удалено");
    }
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const move = async (cat, dir) => {
    const siblings = allCats.filter(c => c.parent_category === cat.parent_category)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = siblings.findIndex(c => c.id === cat.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swap = siblings[swapIdx];
    await Promise.all([
      base44.entities.Category.update(cat.id,  { sort_order: swap.sort_order ?? swapIdx }),
      base44.entities.Category.update(swap.id, { sort_order: cat.sort_order  ?? idx }),
    ]);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const toggle = async (c) => {
    await base44.entities.Category.update(c.id, { is_active: !c.is_active });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const expandAll = () => setExpanded(new Set(categories.map(c => c.id)));
  const collapseAll = () => setExpanded(new Set());

  // ── CSV Import ───────────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    e.target.value = "";
    setImporting(true);
    toast.info("Читаем файл...");
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error("Файл пустой или неверный формат"); setImporting(false); return; }

      // Build existing name set
      const existing = new Set(categories.map(c => c.name.trim().toLowerCase()));
      let created = 0, skipped = 0;

      for (const row of rows) {
        const name   = (row["name"] || row["Название"] || "").trim();
        const parent = (row["parent_category"] || row["Родительская категория"] || "").trim();
        const img    = row["image_url"] || row["URL изображения"] || "";
        const icon   = row["icon"] || row["Иконка"] || "";
        const sort   = parseInt(row["sort_order"] || row["Порядок"] || "0") || 0;

        if (!name) { skipped++; continue; }
        if (existing.has(name.toLowerCase())) { skipped++; continue; }

        await base44.entities.Category.create({
          name, parent_category: parent || null,
          image_url: img, icon, sort_order: sort, is_active: true,
        });
        existing.add(name.toLowerCase());
        created++;
      }
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(`✅ Создано: ${created}, пропущено (уже есть): ${skipped}`);
    } catch (err) {
      toast.error("Ошибка: " + err.message);
    }
    setImporting(false);
  };

  const downloadTemplate = () => {
    const headers = ["name", "parent_category", "image_url", "icon", "sort_order"];
    const examples = [
      ["Кровля", "", "https://example.com/krovlya.jpg", "🏠", "1"],
      ["Металлочерепица", "Кровля", "", "", "1"],
      ["Профнастил", "Кровля", "", "", "2"],
      ["Мягкая кровля", "Кровля", "", "", "3"],
      ["Фасады", "", "", "🧱", "2"],
      ["Сайдинг виниловый", "Фасады", "", "", "1"],
    ];
    const rows = [headers, ...examples];
    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "шаблон_категории.csv";
    a.click();
  };

  // Count all categories including any depth
  const countByParent = (name) => {
    let count = 0;
    const visit = (n) => { categories.filter(c => c.parent_category === n).forEach(c => { count++; visit(c.name); }); };
    visit(name);
    return count;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Категории</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Многоуровневая иерархия · {categories.length} категорий
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2 text-sm">
            <Download className="h-4 w-4" /> Шаблон CSV
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()} disabled={importing} className="gap-2 text-sm">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            {importing ? "Импорт..." : "Импорт CSV"}
          </Button>
          <input ref={importRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleImport} />
          <Button onClick={() => { setEditing("new"); setForm(empty); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
            <Plus className="h-4 w-4" /> Новая категория
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
          <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Импорт из CSV
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-xs">
            Скачайте шаблон → заполните в Excel → сохраните как CSV (разделитель «;») → загрузите.<br />
            Колонки: <b>name</b>, <b>parent_category</b> (пусто = главная), image_url, icon, sort_order
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">💡 Многоуровневая иерархия</p>
          <p className="text-amber-700 dark:text-amber-300 text-xs">
            Любая категория может стать подкатегорией другой. Глубина не ограничена.<br />
            Нажмите <b>▶</b> рядом с категорией чтобы раскрыть её дочерние.
          </p>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editing === "new" ? "Новая категория" : "Редактировать"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Название *</label>
              <Input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Металлочерепица" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Родительская категория
                <span className="text-muted-foreground font-normal ml-1">— пусто = главная</span>
              </label>
              <select value={form.parent_category || ""} onChange={e => f("parent_category", e.target.value)}
                className="w-full h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground">
                <option value="">— Верхний уровень (главная) —</option>
                {allCats.filter(c => c.id !== editing).map(c => (
                  <option key={c.id} value={c.name}>
                    {c.parent_category ? `  └─ ${c.name} (в: ${c.parent_category})` : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Иконка (эмодзи)</label>
              <Input value={form.icon || ""} onChange={e => f("icon", e.target.value)} placeholder="🏠" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">URL изображения</label>
              <Input value={form.image_url || ""} onChange={e => f("image_url", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Порядок сортировки</label>
              <Input type="number" value={form.sort_order} onChange={e => f("sort_order", Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => f("is_active", e.target.checked)} className="rounded" />
                Активна (видна на сайте)
              </label>
            </div>
          </div>
          {/* Preview breadcrumb */}
          {form.name && (
            <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
              <span>Путь:</span>
              {form.parent_category && (
                <>
                  <span className="font-medium">{form.parent_category}</span>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="font-semibold text-foreground">{form.name}</span>
            </div>
          )}
          <div className="flex gap-3 mt-5">
            <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
            <Button variant="outline" onClick={() => { setEditing(null); setForm(empty); }}>Отмена</Button>
          </div>
        </div>
      )}

      {/* Tree controls */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-muted-foreground">{topLevel.length} главных · {categories.length - topLevel.length} подкатегорий</span>
        <button onClick={expandAll} className="text-xs text-[#C0392B] hover:underline flex items-center gap-1">
          <FolderOpen className="h-3 w-3" /> Раскрыть все
        </button>
        <button onClick={collapseAll} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
          <Folder className="h-3 w-3" /> Свернуть все
        </button>
      </div>

      {/* Tree table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-secondary rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Название</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Родитель</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase w-16">Порядок</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Статус</th>
                <th className="px-3 py-2.5 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {tree.map(node => (
                <TreeNode key={node.id} node={node} depth={0}
                  onEdit={node => { setEditing(node.id); setForm({ ...node, parent_category: node.parent_category || "" }); }}
                  onDel={del} onMove={move} onToggle={toggle}
                  expanded={expanded} setExpanded={setExpanded} />
              ))}
              {tree.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-12 text-center text-muted-foreground">
                  Категорий пока нет — создайте первую или импортируйте из CSV
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
