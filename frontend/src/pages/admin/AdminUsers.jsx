import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "@/api/apiClient";
import { useState } from "react";
import { Shield, ShieldOff, User } from "lucide-react";
import { toast } from "sonner";

const fmt = (d) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => Users.list(),
  });

  const filtered = users.filter(u =>
    !search || [u.name, u.phone, u.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleBlock = async (u) => {
    await Users.update(u.id, { is_blocked: !u.is_blocked });
    qc.invalidateQueries({ queryKey: ["adminUsers"] });
    toast.success(u.is_blocked ? "Разблокирован" : "Заблокирован");
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} зарегистрировано</p>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по имени, телефону, email..."
        className="w-full max-w-sm h-9 px-3 border border-border rounded-lg text-sm bg-background mb-4 focus:outline-none" />

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {["Имя","Телефон","Email","Роль","Зарегистрирован","Статус",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3">
                  <div className="h-4 bg-secondary rounded animate-pulse" />
                </td></tr>
              ))
            ) : filtered.map(u => (
              <tr key={u.id} className="border-b border-border hover:bg-secondary transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: "#C0392B" }}>
                      {u.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="font-medium">{u.name || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-secondary text-muted-foreground"}`}>
                    {u.role === "admin" ? "Админ" : "Пользователь"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(u.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_blocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {u.is_blocked ? "Заблокирован" : "Активен"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleBlock(u)}
                    className={`p-1.5 rounded-lg transition-colors hover:bg-secondary ${u.is_blocked ? "text-green-600" : "text-red-500"}`}
                    title={u.is_blocked ? "Разблокировать" : "Заблокировать"}>
                    {u.is_blocked ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <p className="text-center py-10 text-muted-foreground text-sm">Пользователи не найдены</p>
        )}
      </div>
    </div>
  );
}
