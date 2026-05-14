import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useApp } from "@/lib/AppContext";
import { Eye, EyeOff, Phone, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, isLoadingAuth } = useAuth();
  const { t } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || "/";

  const [form,      setForm]      = useState({ login: "", password: "" });
  const [showPwd,   setShowPwd]   = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.login.trim() || !form.password) { setError("Заполните все поля"); return; }
    try {
      await login(form.login, form.password);
      toast.success("Добро пожаловать!");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Ошибка входа");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Вход в аккаунт</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Нет аккаунта?{" "}
            <Link to="/register" state={{ from }} className="font-medium hover:underline" style={{ color: "#C0392B" }}>
              Зарегистрироваться
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone / email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Телефон или Email
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.login}
                  onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
                  placeholder="+7 777 123 45 67"
                  className="w-full h-10 pl-9 pr-3 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Ваш пароль"
                  className="w-full h-10 pl-9 pr-10 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 focus:border-[#C0392B]"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoadingAuth}
              className="w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#C0392B" }}>
              {isLoadingAuth ? "Входим..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
