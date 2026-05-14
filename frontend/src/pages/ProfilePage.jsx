import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useApp } from "@/lib/AppContext";
import { User, Phone, Mail, MapPin, Lock, Package, LogOut, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { t } = useApp();

  const [tab,  setTab]  = useState("profile"); // profile | password | orders
  const [form, setForm] = useState({
    name:    user?.name    || "",
    email:   user?.email   || "",
    address: user?.address || "",
    city:    user?.city    || "",
  });
  const [pwdForm,  setPwdForm]  = useState({ old_password: "", new_password: "", confirm: "" });
  const [saving,   setSaving]   = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdOk,    setPwdOk]    = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Вы не авторизованы</p>
          <Link to="/login" className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: "#C0392B" }}>
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Профиль обновлён");
    } catch (err) {
      toast.error(err.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const savePwd = async (e) => {
    e.preventDefault();
    setPwdError(""); setPwdOk(false);
    if (pwdForm.new_password.length < 6) { setPwdError("Минимум 6 символов"); return; }
    if (pwdForm.new_password !== pwdForm.confirm) { setPwdError("Пароли не совпадают"); return; }
    try {
      await changePassword(pwdForm.old_password, pwdForm.new_password);
      setPwdOk(true);
      setPwdForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwdError(err.message || "Ошибка");
    }
  };

  const TABS = [
    { id: "profile", label: "Профиль",  icon: User },
    { id: "password", label: "Пароль",  icon: Lock },
    { id: "orders",  label: t("myOrders"), icon: Package, link: "/my-orders" },
  ];

  return (
    <div className="bg-background min-h-screen pb-24 sm:pb-0">
      {/* Hero */}
      <div className="py-10" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ backgroundColor: "#C0392B" }}>
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-white/50 text-sm">{user.phone}</p>
          </div>
          <button onClick={logout}
            className="ml-auto flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-xl">
          {TABS.map(({ id, label, icon: Icon, link }) =>
            link ? (
              <Link key={id} to={link}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ) : (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors
                  ${tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            )
          )}
        </div>

        {/* Profile tab */}
        {tab === "profile" && (
          <form onSubmit={saveProfile} className="bg-card border border-border rounded-xl p-6 space-y-4">
            {[
              { field: "name",    label: "Имя",            icon: User,    placeholder: "Иван Иванов" },
              { field: "email",   label: "Email",          icon: Mail,    placeholder: "ivan@mail.ru",    type: "email" },
              { field: "city",    label: "Город",          icon: MapPin,  placeholder: "Астана" },
              { field: "address", label: "Адрес доставки", icon: MapPin,  placeholder: "ул. Абая, 1, кв. 5" },
            ].map(({ field, label, icon: Icon, placeholder, type = "text" }) => (
              <div key={field}>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type={type} value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full h-10 pl-9 pr-3 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B]"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Телефон</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input disabled value={user.phone}
                  className="w-full h-10 pl-9 pr-3 border border-border rounded-lg text-sm bg-secondary text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Телефон изменить нельзя</p>
            </div>
            <button type="submit" disabled={saving}
              className="h-10 px-8 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#C0392B" }}>
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </form>
        )}

        {/* Password tab */}
        {tab === "password" && (
          <form onSubmit={savePwd} className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-sm">
            {[
              { field: "old_password", label: "Текущий пароль",   placeholder: "••••••" },
              { field: "new_password", label: "Новый пароль",      placeholder: "Минимум 6 символов" },
              { field: "confirm",      label: "Повторите пароль",  placeholder: "Повторите пароль" },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="password" value={pwdForm[field]}
                    onChange={e => setPwdForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full h-10 pl-9 pr-3 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B]"
                  />
                </div>
              </div>
            ))}
            {pwdError && <p className="text-sm text-red-500">{pwdError}</p>}
            {pwdOk    && <p className="text-sm text-green-600 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Пароль изменён</p>}
            <button type="submit"
              className="h-10 px-8 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C0392B" }}>
              Изменить пароль
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
