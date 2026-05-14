import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Promocode } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

const empty = { code: "", discount_type: "percent", discount_value: 10, min_order: 0, max_uses: "", expires_at: "", active: true, description: "" };

export default function AdminPromos() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["promocodes"],
    queryFn: Promocode.list,
  });

  const save = async () => {
    if (!form.code.trim()) { toast.error("Введите код промокода"); return; }
    const data = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order: Number(form.min_order) || null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      active: form.active,
    };
    try {
      if (editing === "new") {
        await Promocode.create(data);
        toast.success("Промокод добавлен");
      } else {
        await Promocode.update(editing, data);
        toast.success("Сохранено");
      }
      qc.invalidateQueries({ queryKey: ["promocodes"] });
      setEditing(null);
      setForm(empty);
    } catch (e) {
      toast.error(e.message || "Ошибка сохранения");
    }
  };

  const del = async (id) => {
    if (!confirm("Удалить промокод?")) return;
    await Promocode.delete(id);
    qc.invalidateQueries({ queryKey: ["promocodes"] });
    toast.success("Удалён");
  };

  const toggleActive = async (p) => {
    await Promocode.update(p.id, { active: !p.active });
    qc.invalidateQueries({ queryKey: ["promocodes"] });
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Промокоды</h1>
          <p className="text-muted-foreground text-sm mt-1">Скидочные коды — хранятся в MongoDB</p>
        </div>
        <Button onClick={() => { setEditing("new"); setForm(empty); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
          <Plus className="h-4 w-4" /> Добавить промокод
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
        <p className="font-semibold mb-1">💡 Как работают промокоды</p>
        <p>Клиент вводит код при оформлении заказа. Система проверяет его через <code className="bg-blue-100 px-1 rounded">/api/promocodes/validate/:code</code> — минимальную сумму, срок действия и лимит использований.</p>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editing === "new" ? "Новый промокод" : "Редактировать"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Код *</label>
              <Input value={form.code} onChange={e => f("code", e.target.value.toUpperCase())} placeholder="STROY10" className="uppercase" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Тип скидки</label>
              <select value={form.discount_type} onChange={e => f("discount_type", e.target.value)}
                className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background">
                <option value="percent">% от суммы</option>
                <option value="fixed">Фиксированная сумма (₸)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {form.discount_type === "percent" ? "Скидка %" : "Скидка ₸"}
              </label>
              <Input type="number" min="1" value={form.discount_value} onChange={e => f("discount_value", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Мин. сумма заказа (₸)</label>
              <Input type="number" min="0" value={form.min_order} onChange={e => f("min_order", e.target.value)} placeholder="0 = без ограничений" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Макс. использований</label>
              <Input type="number" min="1" value={form.max_uses} onChange={e => f("max_uses", e.target.value)} placeholder="∞ = неограничено" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Действует до</label>
              <Input type="date" value={form.expires_at} onChange={e => f("expires_at", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => f("active", e.target.checked)} className="rounded" />
              Активен
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Промокодов пока нет</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                {["Код", "Скидка", "Мин. сумма", "Использовано", "Активен", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-secondary">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-[#C0392B] bg-red-50 px-2 py-0.5 rounded">{p.code}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-600">
                    {p.discount_type === "percent" ? `−${p.discount_value}%` : `−${p.discount_value.toLocaleString("ru-RU")} ₸`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.min_order ? `от ${p.min_order.toLocaleString("ru-RU")} ₸` : "Без ограничений"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.uses || 0}{p.max_uses ? `/${p.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.active ? "Да" : "Нет"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditing(p.id);
                        setForm({ code: p.code, discount_type: p.discount_type, discount_value: p.discount_value, min_order: p.min_order || 0, max_uses: p.max_uses || "", expires_at: p.expires_at ? p.expires_at.slice(0,10) : "", active: p.active });
                      }}>
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
        )}
      </div>
    </div>
  );
}
