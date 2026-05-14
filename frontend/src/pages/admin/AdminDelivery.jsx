import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminDelivery() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price_from: "", price_to: "", free_from: "", is_active: true });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["deliverySettings"],
    queryFn: () => base44.entities.DeliverySettings.list()
  });

  const anyActive = settings.some(s => s.is_active);

  const save = async () => {
    if (!form.name) { toast.error("Укажите название"); return; }
    const data = {
      name: form.name,
      price_from: Number(form.price_from) || 0,
      price_to: Number(form.price_to) || 0,
      free_from: Number(form.free_from) || 0,
      is_active: form.is_active
    };
    if (editing === "new") {
      await base44.entities.DeliverySettings.create(data);
      toast.success("Услуга добавлена");
    } else {
      await base44.entities.DeliverySettings.update(editing, data);
      toast.success("Сохранено");
    }
    qc.invalidateQueries({ queryKey: ["deliverySettings"] });
    setEditing(null);
  };

  const del = async (id) => {
    if (!confirm("Удалить?")) return;
    await base44.entities.DeliverySettings.delete(id);
    qc.invalidateQueries({ queryKey: ["deliverySettings"] });
    toast.success("Удалено");
  };

  const toggle = async (item) => {
    await base44.entities.DeliverySettings.update(item.id, { is_active: !item.is_active });
    qc.invalidateQueries({ queryKey: ["deliverySettings"] });
    toast.success(item.is_active ? "Доставка отключена" : "Доставка включена");
  };

  const disableAll = async () => {
    if (!confirm("Отключить всю доставку? Клиенты смогут выбрать только самовывоз.")) return;
    for (const s of settings) {
      if (s.is_active) await base44.entities.DeliverySettings.update(s.id, { is_active: false });
    }
    qc.invalidateQueries({ queryKey: ["deliverySettings"] });
    toast.success("Вся доставка отключена");
  };

  const enableAll = async () => {
    for (const s of settings) {
      if (!s.is_active) await base44.entities.DeliverySettings.update(s.id, { is_active: true });
    }
    qc.invalidateQueries({ queryKey: ["deliverySettings"] });
    toast.success("Доставка включена");
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Доставка</h1>
          <p className="text-muted-foreground text-sm mt-1">Управление услугами доставки</p>
        </div>
        <div className="flex gap-2">
          {anyActive ? (
            <Button onClick={disableAll} variant="outline" className="gap-2 border-amber-400 text-amber-700 hover:bg-amber-50">
              <EyeOff className="h-4 w-4" /> Отключить всю доставку
            </Button>
          ) : (
            <Button onClick={enableAll} variant="outline" className="gap-2 border-green-400 text-green-700 hover:bg-green-50">
              <Eye className="h-4 w-4" /> Включить доставку
            </Button>
          )}
          <Button onClick={() => { setEditing("new"); setForm({ name: "", price_from: "", price_to: "", free_from: "", is_active: true }); }} className="gap-2" style={{ backgroundColor: "#C0392B" }}>
            <Plus className="h-4 w-4" /> Добавить услугу
          </Button>
        </div>
      </div>

      {/* Global status banner */}
      {!anyActive && settings.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Доставка отключена</p>
            <p className="text-xs mt-0.5">В оформлении заказа клиентам доступен только самовывоз. Клиенты видят предупреждение.</p>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editing === "new" ? "Новая услуга" : "Редактировать"}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Название *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Доставка по Астане" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Цена ОТ (₸)</label>
                <Input type="number" value={form.price_from} onChange={e => setForm({ ...form, price_from: e.target.value })} placeholder="1500" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Цена ДО (₸)</label>
                <Input type="number" value={form.price_to} onChange={e => setForm({ ...form, price_to: e.target.value })} placeholder="3000" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Бесплатна от (₸)</label>
                <Input type="number" value={form.free_from} onChange={e => setForm({ ...form, free_from: e.target.value })} placeholder="10000" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
              Активна
            </label>
            <div className="flex gap-3">
              <Button onClick={save} style={{ backgroundColor: "#C0392B" }} className="text-white">Сохранить</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {["Название", "Цена (₸)", "Бесплатна от (₸)", "Статус", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td></tr>
              ))
            ) : settings.map(s => (
              <tr key={s.id} className="border-b border-border hover:bg-secondary">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.price_from} — {s.price_to} ₸</td>
                <td className="px-4 py-3 text-muted-foreground">{s.free_from > 0 ? `${s.free_from} ₸` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-secondary text-muted-foreground"}`}>
                    {s.is_active ? "Активна" : "Отключена"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(s.id); setForm(s); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggle(s)} title={s.is_active ? "Отключить" : "Включить"}>
                      {s.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && settings.length === 0 && <p className="text-center py-10 text-muted-foreground">Услуги не добавлены</p>}
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-semibold mb-1">💡 Как это работает в оформлении заказа:</p>
        <ul className="space-y-1 text-xs">
          <li>• Если хотя бы одна услуга активна — клиент может выбрать «Доставка» или «Самовывоз»</li>
          <li>• Если все услуги отключены — клиент видит предупреждение и может выбрать только «Самовывоз»</li>
          <li>• Стоимость доставки берётся из первой активной услуги (поле «Цена ОТ»)</li>
          <li>• Если заказ превышает «Бесплатна от» — доставка становится бесплатной</li>
        </ul>
      </div>
    </div>
  );
}