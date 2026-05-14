import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Eye, EyeOff, Phone, Lock, User, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Field = ({ label, id, type = "text", value, onChange, placeholder, error, left: Left, right }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      <div className="relative">
        {Left && <Left className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <input
          id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full h-10 ${Left ? "pl-9" : "pl-3"} ${right ? "pr-10" : "pr-3"} border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30 transition-colors
            ${error ? "border-red-400 focus:border-red-400" : "border-border focus:border-[#C0392B]"}`}
        />
        {right}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

export default function RegisterPage() {
  const { register, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from || "/";

  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", confirmPassword: "",
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Введите имя";
    if (!form.phone.trim())    e.phone    = "Введите телефон";
    if (!form.password)        e.password = "Введите пароль";
    if (form.password.length < 6) e.password = "Минимум 6 символов";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Пароли не совпадают";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    try {
      await register(form.name, form.phone, form.email, form.password);
      toast.success("Регистрация успешна! Добро пожаловать!");
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || "Ошибка регистрации");
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Создать аккаунт</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Уже есть аккаунт?{" "}
            <Link to="/login" state={{ from }} className="font-medium hover:underline" style={{ color: "#C0392B" }}>
              Войти
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Имя" id="name" value={form.name} onChange={f("name")}
              placeholder="Иван Иванов" error={errors.name} left={User} />

            <Field label="Телефон *" id="phone" value={form.phone} onChange={f("phone")}
              placeholder="+7 777 123 45 67" error={errors.phone} left={Phone} />

            <Field label="Email (необязательно)" id="email" type="email" value={form.email} onChange={f("email")}
              placeholder="ivan@mail.ru" error={errors.email} left={Mail} />

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Пароль *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={f("password")}
                  placeholder="Минимум 6 символов"
                  className={`w-full h-10 pl-9 pr-10 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30
                    ${errors.password ? "border-red-400" : "border-border focus:border-[#C0392B]"}`}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Повторите пароль *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={f("confirmPassword")}
                  placeholder="Повторите пароль"
                  className={`w-full h-10 pl-9 pr-10 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#C0392B]/30
                    ${errors.confirmPassword ? "border-red-400" : "border-border focus:border-[#C0392B]"}`}
                />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            {apiError && (
              <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800">
                {apiError}
              </div>
            )}

            <button type="submit" disabled={isLoadingAuth}
              className="w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#C0392B" }}>
              {isLoadingAuth ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Регистрируясь, вы соглашаетесь с условиями использования
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
