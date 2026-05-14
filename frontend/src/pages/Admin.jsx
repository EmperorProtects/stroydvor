import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Auth, Product, Category, Promocode, Consultation, Banner } from "@/api/apiClient";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Plus, Pencil, Trash2, Save, X, Package, Megaphone, Tag, ChevronDown, ChevronUp,
  ImagePlus, LayoutDashboard, Lock, Eye, EyeOff, Upload, CheckSquare, Square,
  RefreshCw, Ticket, FileText, AlertCircle, CheckCircle, Clock,
  Search, ChevronRight, FileSpreadsheet, LogOut, Loader2
} from "lucide-react";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const ALL_UNITS = ["шт","м²","м³","кг","м.п.","уп","рул","л"];
const BANNER_SLOTS = [
  { slot:"top",   label:"Главный баннер (большой)" },
  { slot:"card1", label:"Мини-баннер 1 (левый)" },
  { slot:"card2", label:"Мини-баннер 2 (правый)" },
];
const EMPTY_PRODUCT = { title:"", description:"", price:"", old_price:"", category:"", subcategory:"", image:"", in_stock:true, unit:"шт", brand:"", is_featured:false, is_sale:false, sku:"" };
const EMPTY_BANNER  = { badge_text:"", title:"", subtitle:"", price_label:"", price_value:"", price_unit:"", button_text:"", button_link:"", bg_color:"#1A1A1A", accent_color:"#C0392B" };

const MICROINVEST_FIELDS = {
  "Наименование":"title","Артикул":"sku","Цена":"price","Цена продажи":"price",
  "Стоимость":"price","Группа":"category","Категория":"category","Описание":"description",
  "Единица":"unit","Ед.изм.":"unit","Бренд":"brand","Производитель":"brand",
  "Остаток":"stock_qty","Количество":"stock_qty","Старая цена":"old_price","Цена 2":"old_price",
};

// ─── UI PRIMITIVES ──────────────────────────────────────────────────────────
const Input = ({ label, ...p }) => (
  <label className="flex flex-col gap-1">
    {label && <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">{label}</span>}
    <input {...p} className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C0392B] transition-colors" />
  </label>
);
const Textarea = ({ label, ...p }) => (
  <label className="flex flex-col gap-1">
    {label && <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">{label}</span>}
    <textarea {...p} rows={3} className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C0392B] transition-colors resize-none" />
  </label>
);
const Select = ({ label, children, ...p }) => (
  <label className="flex flex-col gap-1">
    {label && <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">{label}</span>}
    <select {...p} className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C0392B] transition-colors">
      {children}
    </select>
  </label>
);
const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <div onClick={() => onChange(!checked)} className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${checked?"bg-[#C0392B]":"bg-[#2a2a2a]"}`}>
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked?"translate-x-4":"translate-x-0"}`} />
    </div>
    {label && <span className="text-sm text-[#aaa]">{label}</span>}
  </label>
);
const Btn = ({ children, variant="primary", size="md", className="", loading=false, ...p }) => {
  const sz = size==="sm"?"px-3 py-1.5 text-xs":"px-4 py-2 text-sm";
  const v  = variant==="primary" ? "bg-[#C0392B] text-white hover:bg-[#a93226] disabled:opacity-50"
           : variant==="ghost"   ? "bg-transparent text-[#aaa] hover:text-white hover:bg-[#1e1e1e]"
           : variant==="danger"  ? "bg-[#2a0a0a] text-red-400 hover:bg-red-900/40"
           : variant==="success" ? "bg-[#0a2a0a] text-green-400 hover:bg-green-900/40"
           :                       "bg-[#1e1e1e] text-[#ccc] hover:bg-[#2a2a2a]";
  return (
    <button className={`inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all ${sz} ${v} ${className}`} {...p}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );
};
const Card = ({ children, className="" }) => (
  <div className={`bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl ${className}`}>{children}</div>
);
const Badge = ({ children, color="gray" }) => {
  const c = { gray:"bg-[#2a2a2a] text-[#888]", red:"bg-[#C0392B]/20 text-[#C0392B]", green:"bg-green-900/30 text-green-400", amber:"bg-amber-900/30 text-amber-400", blue:"bg-blue-900/30 text-blue-400" };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${c[color]}`}>{children}</span>;
};
const Spinner = () => <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#555]" /></div>;

// ─── 1. LOGIN ───────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("admin");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);

  const mut = useMutation({
    mutationFn: () => Auth.login(user, pw),
    onSuccess: () => onLogin(),
    onError: (e) => {
      toast.error(e.message || "Неверный логин или пароль");
      setShake(true); setTimeout(() => setShake(false), 600);
    },
  });

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
      <div style={{ animation: shake?"shake 0.5s ease":"" }} className="w-full max-w-sm">
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-2xl bg-[#C0392B] flex items-center justify-center font-black text-2xl mx-auto">А</div>
            <h1 className="text-xl font-bold text-white">Админ-панель</h1>
            <p className="text-sm text-[#555]">Стройдворк · Войдите для доступа</p>
          </div>
          <div className="space-y-3">
            <Input label="Логин" value={user} onChange={e=>setUser(e.target.value)} placeholder="admin" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Пароль</span>
              <div className="relative">
                <input type={show?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&mut.mutate()}
                  placeholder="Введите пароль..."
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C0392B] pr-10 transition-colors" />
                <button onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
                  {show?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                </button>
              </div>
            </div>
            <Btn onClick={()=>mut.mutate()} loading={mut.isPending} disabled={mut.isPending} className="w-full justify-center">
              <Lock className="h-4 w-4"/>Войти
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── 2. DASHBOARD ──────────────────────────────────────────────────────────
function Dashboard({ products, leads, promos }) {
  const inStock = products.filter(p=>p.in_stock).length;
  const onSale = products.filter(p=>p.is_sale).length;
  const newLeads = leads.filter(l=>l.status==="new").length;
  const activePromos = promos.filter(p=>p.active).length;

  const catMap = {};
  products.forEach(p => { catMap[p.category] = (catMap[p.category]||0)+1; });
  const catStats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCat = Math.max(...catStats.map(c=>c[1]),1);

  const metrics = [
    { label:"Товаров", value:products.length, icon:Package, color:"text-blue-400", bg:"bg-blue-900/20" },
    { label:"В наличии", value:inStock, icon:CheckCircle, color:"text-green-400", bg:"bg-green-900/20" },
    { label:"На акции", value:onSale, icon:Tag, color:"text-amber-400", bg:"bg-amber-900/20" },
    { label:"Новых заявок", value:newLeads, icon:FileText, color:"text-[#C0392B]", bg:"bg-red-900/20", pulse:newLeads>0 },
    { label:"Промокодов", value:activePromos, icon:Ticket, color:"text-purple-400", bg:"bg-purple-900/20" },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold text-white">Дашборд</h2><p className="text-sm text-[#555]">Ключевые метрики магазина</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map(m=>(
          <Card key={m.label} className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0 relative`}>
              {m.pulse && <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/30"/>}
              <m.icon className={`h-5 w-5 ${m.color}`}/>
            </div>
            <div><p className="text-2xl font-black text-white">{m.value}</p><p className="text-xs text-[#555]">{m.label}</p></div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-4">По категориям</h3>
          <div className="space-y-3">
            {catStats.map(([name,count])=>(
              <div key={name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate">{name}</span>
                    <span className="text-xs text-[#555] shrink-0 ml-2">{count}</span>
                  </div>
                  <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C0392B] rounded-full" style={{width:`${(count/maxCat)*100}%`}}/>
                  </div>
                </div>
              </div>
            ))}
            {catStats.length===0 && <p className="text-sm text-[#555]">Нет товаров</p>}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-4">Требуют внимания</h3>
          <div className="space-y-2">
            {[
              { label:`${newLeads} новых заявок`, color:"text-[#C0392B]", icon:AlertCircle },
              { label:`${products.length-inStock} товаров нет в наличии`, color:"text-amber-400", icon:Clock },
              { label:`${onSale} товаров на акции`, color:"text-green-400", icon:Tag },
              { label:`${products.filter(p=>!p.image).length} товаров без фото`, color:"text-blue-400", icon:ImagePlus },
            ].map(item=>(
              <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#111] border border-[#1e1e1e]">
                <item.icon className={`h-4 w-4 ${item.color} shrink-0`}/>
                <span className="text-sm text-[#aaa]">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {leads.length>0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-4">Последние заявки</h3>
          <div className="space-y-2">
            {leads.slice(0,5).map(lead=>(
              <div key={lead.id} className="flex items-center gap-3 py-2 border-b border-[#1e1e1e] last:border-0">
                <div className={`h-2 w-2 rounded-full shrink-0 ${lead.status==="new"?"bg-[#C0392B] animate-pulse":lead.status==="done"?"bg-green-500":"bg-amber-500"}`}/>
                <span className="text-sm text-white flex-1 truncate">{lead.name}</span>
                <span className="text-xs text-[#555]">{lead.phone}</span>
                <span className="text-xs text-[#444]">{new Date(lead.created_date).toLocaleDateString("ru-RU")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── 3. CATEGORIES CRUD ─────────────────────────────────────────────────────
function CategoriesTab({ products }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({name:"",slug:"",icon:"📦",subcategories:[],sort_order:0});
  const [newSub, setNewSub] = useState("");
  const [expanded, setExpanded] = useState(null);

  const { data: cats=[], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: Category.list,
  });

  const createMut = useMutation({
    mutationFn: Category.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:["categories"]}); setEditing(null); toast.success("Категория создана"); },
    onError: e => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({id, data}) => Category.update(id, data),
    onSuccess: () => { qc.invalidateQueries({queryKey:["categories"]}); setEditing(null); toast.success("Обновлено"); },
    onError: e => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: Category.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:["categories"]}); toast.success("Удалено"); },
    onError: e => toast.error(e.message),
  });

  const save = () => {
    if (!form.name.trim()) return toast.error("Введите название");
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-zа-яё0-9-]/gi,"");
    if (editing==="new") createMut.mutate({...form, slug});
    else updateMut.mutate({id:editing.id, data:{...form, slug}});
  };

  const startEdit = (cat) => { setEditing(cat); setForm({name:cat.name,slug:cat.slug,icon:cat.icon||"📦",subcategories:[...(cat.subcategories||[])],sort_order:cat.sort_order||0}); };
  const addSub = () => { if(!newSub.trim()) return; setForm(f=>({...f,subcategories:[...f.subcategories,newSub.trim()]})); setNewSub(""); };
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-white">Категории</h2><p className="text-sm text-[#555]">2-уровневый справочник · MongoDB</p></div>
        <Btn onClick={()=>{setEditing("new");setForm({name:"",slug:"",icon:"📦",subcategories:[],sort_order:0});}}><Plus className="h-4 w-4"/>Добавить</Btn>
      </div>

      {(editing==="new"||editing?.id) && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm">{editing==="new"?"Новая категория":"Редактировать категорию"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Название *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Кровля"/>
            <Input label="Иконка" value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} placeholder="📦"/>
            <Input label="Slug (URL)" value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} placeholder="krovlya"/>
            <Input label="Порядок сортировки" type="number" value={form.sort_order} onChange={e=>setForm(f=>({...f,sort_order:parseInt(e.target.value)||0}))} placeholder="0"/>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Подкатегории</span>
            <div className="mt-2 flex gap-2">
              <input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="Добавить подкатегорию..."
                className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C0392B]"/>
              <Btn variant="secondary" size="sm" onClick={addSub}><Plus className="h-3.5 w-3.5"/></Btn>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.subcategories.map((s,i)=>(
                <span key={i} className="flex items-center gap-1.5 bg-[#1e1e1e] text-[#ccc] text-xs px-2.5 py-1 rounded-full">
                  {s}<button onClick={()=>setForm(f=>({...f,subcategories:f.subcategories.filter((_,j)=>j!==i)}))} className="text-[#555] hover:text-red-400"><X className="h-3 w-3"/></button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Btn onClick={save} loading={saving} disabled={saving}><Save className="h-4 w-4"/>Сохранить</Btn>
            <Btn variant="ghost" onClick={()=>setEditing(null)}><X className="h-4 w-4"/>Отмена</Btn>
          </div>
        </Card>
      )}

      {isLoading ? <Spinner/> : (
        <div className="space-y-2">
          {cats.map(cat=>{
            const count=products.filter(p=>p.category===cat.name).length;
            const isExp=expanded===cat.id;
            return (
              <Card key={cat.id} className="overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <span className="text-2xl">{cat.icon||"📦"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-semibold text-white">{cat.name}</span><Badge>{count} тов.</Badge>{cat.subcategories?.length>0&&<Badge color="blue">{cat.subcategories.length} подкат.</Badge>}</div>
                    <p className="text-xs text-[#555] mt-0.5">/{cat.slug} · порядок: {cat.sort_order||0}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Btn variant="ghost" size="sm" onClick={()=>startEdit(cat)}><Pencil className="h-3.5 w-3.5"/></Btn>
                    <Btn variant="danger" size="sm" onClick={()=>{if(confirm("Удалить категорию?")) deleteMut.mutate(cat.id);}} loading={deleteMut.isPending}><Trash2 className="h-3.5 w-3.5"/></Btn>
                    {cat.subcategories?.length>0&&<Btn variant="ghost" size="sm" onClick={()=>setExpanded(isExp?null:cat.id)}>{isExp?<ChevronUp className="h-3.5 w-3.5"/>:<ChevronDown className="h-3.5 w-3.5"/>}</Btn>}
                  </div>
                </div>
                {isExp&&cat.subcategories?.length>0&&(
                  <div className="border-t border-[#1e1e1e] px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {cat.subcategories.map(s=><div key={s} className="flex items-center gap-2 text-xs text-[#aaa] bg-[#111] rounded-lg px-3 py-2"><ChevronRight className="h-3 w-3 text-[#444]"/>{s}</div>)}
                  </div>
                )}
              </Card>
            );
          })}
          {cats.length===0&&<div className="text-center py-16 text-[#555]">Категорий пока нет — создайте первую</div>}
        </div>
      )}
    </div>
  );
}

// ─── 4. PRODUCT FORM ────────────────────────────────────────────────────────
function ProductForm({ initial, onSave, onCancel, saving, categories }) {
  const [f, setF] = useState(initial||EMPTY_PRODUCT);
  const [imgPreview, setImgPreview] = useState(initial?.image||"");
  const fileRef = useRef();
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const selectedCat = categories.find(c=>c.name===f.category);

  const handleFile = (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{setImgPreview(ev.target.result);set("image",ev.target.result);};
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#0e0e0e] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Название *" value={f.title} onChange={e=>set("title",e.target.value)} placeholder="Название товара"/>
        <Input label="Артикул / SKU" value={f.sku||""} onChange={e=>set("sku",e.target.value)} placeholder="ABC-001"/>
        <Input label="Бренд" value={f.brand||""} onChange={e=>set("brand",e.target.value)} placeholder="Производитель"/>
        <Select label="Единица" value={f.unit||"шт"} onChange={e=>set("unit",e.target.value)}>
          {ALL_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
        </Select>
        <Input label="Цена (₸) *" type="number" value={f.price} onChange={e=>set("price",e.target.value)} placeholder="0"/>
        <Input label="Старая цена (₸)" type="number" value={f.old_price||""} onChange={e=>set("old_price",e.target.value)} placeholder="0"/>
        <Select label="Категория *" value={f.category} onChange={e=>set("category",e.target.value)}>
          <option value="">— Выберите —</option>
          {categories.map(c=><option key={c.id} value={c.name}>{c.icon||"📦"} {c.name}</option>)}
        </Select>
        {selectedCat?.subcategories?.length>0&&(
          <Select label="Подкатегория" value={f.subcategory||""} onChange={e=>set("subcategory",e.target.value)}>
            <option value="">— Не выбрана —</option>
            {selectedCat.subcategories.map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
        )}
      </div>
      <Textarea label="Описание" value={f.description||""} onChange={e=>set("description",e.target.value)} placeholder="Описание товара..."/>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Изображение</span>
        <div className="flex items-start gap-4">
          <div onClick={()=>fileRef.current?.click()} className="h-24 w-24 rounded-xl border-2 border-dashed border-[#2a2a2a] hover:border-[#C0392B] transition-colors flex items-center justify-center cursor-pointer shrink-0 overflow-hidden">
            {imgPreview?<img src={imgPreview} alt="" className="h-full w-full object-cover" onError={()=>setImgPreview("")}/>:<ImagePlus className="h-8 w-8 text-[#444]"/>}
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
            <Btn variant="secondary" size="sm" onClick={()=>fileRef.current?.click()}><Upload className="h-3.5 w-3.5"/>Загрузить фото</Btn>
            <p className="text-xs text-[#555]">или вставьте URL:</p>
            <Input value={f.image||""} onChange={e=>{set("image",e.target.value);setImgPreview(e.target.value);}} placeholder="https://..."/>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-6 pt-2">
        <Toggle label="В наличии" checked={!!f.in_stock} onChange={v=>set("in_stock",v)}/>
        <Toggle label="Рекомендуемый" checked={!!f.is_featured} onChange={v=>set("is_featured",v)}/>
        <Toggle label="Акция" checked={!!f.is_sale} onChange={v=>set("is_sale",v)}/>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn onClick={()=>onSave(f)} loading={saving} disabled={saving}><Save className="h-4 w-4"/>Сохранить</Btn>
        <Btn variant="ghost" onClick={onCancel}><X className="h-4 w-4"/>Отмена</Btn>
      </div>
    </div>
  );
}

// ─── 5. PRODUCTS TAB (bulk ops) ─────────────────────────────────────────────
function ProductsTab({ products, isLoading, categories, qc }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Все");
  const [statusFilter, setStatusFilter] = useState("Все");
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkCat, setBulkCat] = useState("");

  const filtered = products.filter(p=>{
    const mc=catFilter==="Все"||p.category===catFilter;
    const ms=statusFilter==="Все"||(statusFilter==="in_stock"&&p.in_stock)||(statusFilter==="out_stock"&&!p.in_stock)||(statusFilter==="sale"&&p.is_sale)||(statusFilter==="featured"&&p.is_featured);
    const mt=!search.trim()||p.title?.toLowerCase().includes(search.toLowerCase())||p.brand?.toLowerCase().includes(search.toLowerCase())||p.sku?.toLowerCase().includes(search.toLowerCase());
    return mc&&ms&&mt;
  });

  const toggleAll=()=>setSelected(selected.size===filtered.length?new Set():new Set(filtered.map(p=>p.id)));

  const saveProduct = async (f) => {
    setSaving(true);
    try {
      const data={...f,price:parseFloat(f.price)||0,old_price:f.old_price?parseFloat(f.old_price):undefined};
      if(!data.old_price) delete data.old_price;
      if(editing?.id){await Product.update(editing.id,data);toast.success("Товар обновлён");}
      else{await Product.create(data);toast.success("Товар создан");}
      qc.invalidateQueries({queryKey:["products"]}); setEditing(null);
    } catch(e){toast.error(e.message||"Ошибка сохранения");}
    setSaving(false);
  };

  const deleteProduct = async (id,title) => {
    if(!confirm(`Удалить «${title}»?`)) return;
    try{await Product.delete(id);qc.invalidateQueries({queryKey:["products"]});toast.success("Удалено");}
    catch(e){toast.error(e.message||"Ошибка удаления");}
  };

  const applyBulk = async () => {
    if(!bulkAction||selected.size===0) return;
    const ids=[...selected];
    try {
      if(bulkAction==="delete"){
        if(!confirm(`Удалить ${ids.length} товаров?`)) return;
        await Promise.all(ids.map(id=>Product.delete(id)));
        toast.success(`Удалено ${ids.length} товаров`);
      } else if(bulkAction==="in_stock"){ await Promise.all(ids.map(id=>Product.update(id,{in_stock:true}))); toast.success("Статус: в наличии"); }
      else if(bulkAction==="out_stock"){ await Promise.all(ids.map(id=>Product.update(id,{in_stock:false}))); toast.success("Статус: нет в наличии"); }
      else if(bulkAction==="sale_on"){ await Promise.all(ids.map(id=>Product.update(id,{is_sale:true}))); toast.success("Акция включена"); }
      else if(bulkAction==="sale_off"){ await Promise.all(ids.map(id=>Product.update(id,{is_sale:false}))); toast.success("Акция выключена"); }
      else if(bulkAction==="change_cat"&&bulkCat){ await Promise.all(ids.map(id=>Product.update(id,{category:bulkCat}))); toast.success(`Категория: ${bulkCat}`); }
    } catch(e){ toast.error(e.message||"Ошибка"); }
    qc.invalidateQueries({queryKey:["products"]}); setSelected(new Set()); setBulkAction("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по названию, SKU..."
            className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C0392B]"/>
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C0392B]">
          <option value="Все">Все категории</option>
          {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C0392B]">
          <option value="Все">Все статусы</option>
          <option value="in_stock">В наличии</option>
          <option value="out_stock">Нет в наличии</option>
          <option value="sale">Акция</option>
          <option value="featured">Рекомендуемые</option>
        </select>
        <Btn onClick={()=>setEditing("new")}><Plus className="h-4 w-4"/>Добавить</Btn>
      </div>

      {selected.size>0&&(
        <Card className="p-3 flex flex-wrap items-center gap-3 border-[#C0392B]/40 bg-[#C0392B]/5">
          <span className="text-sm font-semibold text-[#C0392B]">Выбрано: {selected.size}</span>
          <select value={bulkAction} onChange={e=>setBulkAction(e.target.value)} className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
            <option value="">— Действие —</option>
            <option value="delete">🗑 Удалить</option>
            <option value="in_stock">✅ В наличии</option>
            <option value="out_stock">❌ Нет в наличии</option>
            <option value="sale_on">🏷 Включить акцию</option>
            <option value="sale_off">🏷 Выключить акцию</option>
            <option value="change_cat">📁 Сменить категорию</option>
          </select>
          {bulkAction==="change_cat"&&(
            <select value={bulkCat} onChange={e=>setBulkCat(e.target.value)} className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
              <option value="">— Категория —</option>
              {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}
          <Btn size="sm" onClick={applyBulk} disabled={!bulkAction}>Применить</Btn>
          <Btn variant="ghost" size="sm" onClick={()=>setSelected(new Set())}>Отмена</Btn>
        </Card>
      )}

      {editing==="new"&&(
        <ProductForm initial={EMPTY_PRODUCT} onSave={saveProduct} onCancel={()=>setEditing(null)} saving={saving} categories={categories}/>
      )}

      {isLoading?<Spinner/>:(
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#555] pb-1">
            <button onClick={toggleAll} className="flex items-center gap-1 hover:text-white transition-colors">
              {selected.size===filtered.length&&filtered.length>0?<CheckSquare className="h-3.5 w-3.5"/>:<Square className="h-3.5 w-3.5"/>}
              Выбрать все
            </button>
            <span className="text-[#333]">·</span><span>{filtered.length} товаров</span>
          </div>
          {filtered.map(p=>(
            <div key={p.id} className={`bg-[#0e0e0e] border rounded-xl overflow-hidden transition-colors ${selected.has(p.id)?"border-[#C0392B]/50":"border-[#1e1e1e]"}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={()=>setSelected(s=>{const n=new Set(s);n.has(p.id)?n.delete(p.id):n.add(p.id);return n;})} className="shrink-0 text-[#555] hover:text-[#C0392B]">
                  {selected.has(p.id)?<CheckSquare className="h-4 w-4 text-[#C0392B]"/>:<Square className="h-4 w-4"/>}
                </button>
                {p.image?<img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0 bg-[#1e1e1e]" onError={e=>e.target.style.display='none'}/>
                  :<div className="h-12 w-12 rounded-lg bg-[#1e1e1e] shrink-0 flex items-center justify-center"><ImagePlus className="h-5 w-5 text-[#444]"/></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-white truncate">{p.title}</span>
                    {p.is_sale&&<Badge color="red">АКЦИЯ</Badge>}
                    {p.is_featured&&<Badge color="amber">ТОП</Badge>}
                    {!p.in_stock&&<Badge>НЕТ В НАЛ.</Badge>}
                    {p.sku&&<Badge color="blue">{p.sku}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#888]">{p.category}{p.subcategory?` / ${p.subcategory}`:""}</span>
                    <span className="text-xs font-semibold text-white">{p.price?.toLocaleString("ru-RU")} ₸</span>
                    {p.brand&&<span className="text-xs text-[#666]">{p.brand}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Btn variant="ghost" size="sm" onClick={()=>setEditing(editing?.id===p.id?null:p)}><Pencil className="h-3.5 w-3.5"/></Btn>
                  <Btn variant="danger" size="sm" onClick={()=>deleteProduct(p.id,p.title)}><Trash2 className="h-3.5 w-3.5"/></Btn>
                </div>
              </div>
              {editing?.id===p.id&&(
                <div className="border-t border-[#1e1e1e] p-4">
                  <ProductForm initial={editing} onSave={saveProduct} onCancel={()=>setEditing(null)} saving={saving} categories={categories}/>
                </div>
              )}
            </div>
          ))}
          {filtered.length===0&&<div className="text-center py-20 text-[#555]">Товары не найдены</div>}
        </div>
      )}
    </div>
  );
}

// ─── 6. EXCEL IMPORTER ─────────────────────────────────────────────────────
function ExcelImporter({ categories, qc }) {
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try {
        const wb=XLSX.read(ev.target.result,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const data=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
        if(data.length<2) return toast.error("Файл пустой");
        const hdrs=data[0].map(h=>String(h).trim());
        setHeaders(hdrs); setRows(data.slice(1).filter(r=>r.some(c=>c!=="")));
        const auto={};
        hdrs.forEach(h=>{if(MICROINVEST_FIELDS[h]) auto[h]=MICROINVEST_FIELDS[h];});
        setMapping(auto); setStep(2);
      } catch{toast.error("Ошибка чтения файла");}
    };
    reader.readAsArrayBuffer(file);
  };

  const buildPreview = () => {
    setPreview(rows.slice(0,10).map(row=>{
      const obj={};
      headers.forEach((h,i)=>{if(mapping[h]) obj[mapping[h]]=row[i];});
      return obj;
    }));
    setStep(3);
  };

  // Auto-create categories in MongoDB
  const autoCreateCategories = async (catNames) => {
    const existing = categories.map(c=>c.name);
    const toCreate = [...new Set(catNames)].filter(n=>n&&!existing.includes(n));
    let added=0;
    for(const name of toCreate){
      try {
        await Category.create({name,slug:name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-zа-яё0-9-]/gi,""),icon:"📦",subcategories:[],sort_order:99});
        added++;
      } catch{}
    }
    if(added>0) qc.invalidateQueries({queryKey:["categories"]});
    return added;
  };

  const doImport = async () => {
    setImporting(true);
    let ok=0,fail=0;
    const catNames=rows.map(row=>{
      const obj={};
      headers.forEach((h,i)=>{if(mapping[h]) obj[mapping[h]]=row[i];});
      return obj.category;
    }).filter(Boolean);
    const newCatCount = await autoCreateCategories(catNames);

    for(const row of rows){
      const obj={};
      headers.forEach((h,i)=>{if(mapping[h]) obj[mapping[h]]=String(row[i]).trim();});
      if(!obj.title){fail++;continue;}
      try {
        await Product.create({title:obj.title,sku:obj.sku||"",price:parseFloat(obj.price)||0,old_price:obj.old_price?parseFloat(obj.old_price):undefined,category:obj.category||"Прочее",description:obj.description||"",unit:obj.unit||"шт",brand:obj.brand||"",in_stock:obj.stock_qty?parseInt(obj.stock_qty)>0:true,is_featured:false,is_sale:false});
        ok++;
      } catch{fail++;}
    }
    qc.invalidateQueries({queryKey:["products"]});
    setResult({ok,fail,newCats:newCatCount}); setStep(4); setImporting(false);
  };

  const reset=()=>{setStep(1);setRows([]);setHeaders([]);setMapping({});setPreview([]);setResult(null);};
  const FIELD_OPTIONS=["title","sku","price","old_price","category","description","unit","brand","stock_qty","— игнорировать —"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h2 className="text-lg font-bold text-white">Импорт из Excel</h2><p className="text-sm text-[#555]">Парсер Microinvest · авто-создание категорий в MongoDB</p></div>
      <div className="flex items-center gap-2">
        {["Загрузка","Маппинг","Предпросмотр","Результат"].map((s,i)=>(
          <div key={i} className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${step>i+1?"bg-green-500 text-white":step===i+1?"bg-[#C0392B] text-white":"bg-[#2a2a2a] text-[#555]"}`}>{step>i+1?"✓":i+1}</div>
            <span className={`text-xs hidden sm:inline ${step===i+1?"text-white":"text-[#555]"}`}>{s}</span>
            {i<3&&<div className="w-6 h-px bg-[#2a2a2a]"/>}
          </div>
        ))}
      </div>
      {step===1&&(
        <Card className="p-8 text-center space-y-4">
          <FileSpreadsheet className="h-12 w-12 text-[#444] mx-auto"/>
          <div><p className="text-white font-semibold">Выберите Excel-файл</p><p className="text-sm text-[#555] mt-1">Поддерживаются .xlsx, .xls от Microinvest</p></div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile}/>
          <Btn onClick={()=>fileRef.current?.click()}><Upload className="h-4 w-4"/>Выбрать файл</Btn>
        </Card>
      )}
      {step===2&&(
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-sm text-[#888] mb-3">Найдено <span className="text-white font-bold">{rows.length}</span> строк. Настройте маппинг:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {headers.map(h=>(
                <div key={h} className="space-y-1">
                  <span className="text-xs text-[#888] font-mono">{h}</span>
                  <select value={mapping[h]||"— игнорировать —"} onChange={e=>setMapping(m=>({...m,[h]:e.target.value==="— игнорировать —"?undefined:e.target.value}))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C0392B]">
                    {FIELD_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex gap-3">
            <Btn onClick={buildPreview}><Eye className="h-4 w-4"/>Предпросмотр</Btn>
            <Btn variant="ghost" onClick={reset}><X className="h-4 w-4"/>Сначала</Btn>
          </div>
        </div>
      )}
      {step===3&&(
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e1e]"><p className="text-sm text-[#888]">Предпросмотр первых 10 из <span className="text-white font-bold">{rows.length}</span></p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#1e1e1e]">{["Название","Артикул","Цена","Категория","Ед.изм.","Бренд"].map(h=><th key={h} className="px-3 py-2 text-left text-[#555] font-semibold">{h}</th>)}</tr></thead>
                <tbody>
                  {preview.map((row,i)=>(
                    <tr key={i} className="border-b border-[#111] hover:bg-[#111]">
                      <td className="px-3 py-2 text-white">{row.title||"—"}</td>
                      <td className="px-3 py-2 text-[#888]">{row.sku||"—"}</td>
                      <td className="px-3 py-2 text-white">{row.price?`${parseFloat(row.price).toLocaleString("ru-RU")} ₸`:"—"}</td>
                      <td className="px-3 py-2 text-[#888]">{row.category||"—"}</td>
                      <td className="px-3 py-2 text-[#888]">{row.unit||"—"}</td>
                      <td className="px-3 py-2 text-[#888]">{row.brand||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex gap-3">
            <Btn onClick={doImport} loading={importing} disabled={importing}>{importing?`Импорт...`:`Импортировать ${rows.length} товаров`}</Btn>
            <Btn variant="ghost" onClick={()=>setStep(2)}>← Назад</Btn>
          </div>
        </div>
      )}
      {step===4&&result&&(
        <Card className="p-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto"/>
          <p className="text-xl font-bold text-white">Импорт завершён</p>
          <div className="flex justify-center gap-8">
            <div><p className="text-2xl font-black text-green-400">{result.ok}</p><p className="text-xs text-[#555]">Добавлено</p></div>
            <div><p className="text-2xl font-black text-red-400">{result.fail}</p><p className="text-xs text-[#555]">Ошибок</p></div>
            <div><p className="text-2xl font-black text-blue-400">{result.newCats}</p><p className="text-xs text-[#555]">Новых категорий</p></div>
          </div>
          <Btn onClick={reset}><RefreshCw className="h-4 w-4"/>Импортировать ещё</Btn>
        </Card>
      )}
    </div>
  );
}

// ─── 7. PROMOS CRUD (MongoDB) ────────────────────────────────────────────────
function PromosTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({code:"",discount_type:"percent",discount_value:"",min_order:"",max_uses:"",active:true,expires_at:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const { data:promos=[], isLoading } = useQuery({
    queryKey: ["promocodes"],
    queryFn: Promocode.list,
  });

  const createMut = useMutation({ mutationFn: Promocode.create, onSuccess: ()=>{qc.invalidateQueries({queryKey:["promocodes"]});setEditing(null);toast.success("Промокод создан");}, onError:e=>toast.error(e.message) });
  const updateMut = useMutation({ mutationFn:({id,data})=>Promocode.update(id,data), onSuccess:()=>{qc.invalidateQueries({queryKey:["promocodes"]});setEditing(null);toast.success("Обновлено");}, onError:e=>toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: Promocode.delete, onSuccess:()=>{qc.invalidateQueries({queryKey:["promocodes"]});toast.success("Удалено");}, onError:e=>toast.error(e.message) });

  const save=()=>{
    if(!form.code.trim()) return toast.error("Введите код");
    if(!form.discount_value) return toast.error("Введите скидку");
    const data={...form,discount_value:parseFloat(form.discount_value),min_order:form.min_order?parseFloat(form.min_order):null,max_uses:form.max_uses?parseInt(form.max_uses):null,expires_at:form.expires_at||null};
    if(editing==="new") createMut.mutate(data);
    else updateMut.mutate({id:editing.id,data});
  };

  const toggleActive=(promo)=>updateMut.mutate({id:promo.id,data:{active:!promo.active}});
  const startEdit=(promo)=>{setEditing(promo);setForm({code:promo.code,discount_type:promo.discount_type,discount_value:String(promo.discount_value),min_order:promo.min_order?String(promo.min_order):"",max_uses:promo.max_uses?String(promo.max_uses):"",active:promo.active,expires_at:promo.expires_at?promo.expires_at.slice(0,10):""});};
  const saving=createMut.isPending||updateMut.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-white">Промокоды</h2><p className="text-sm text-[#555]">MongoDB · валидация через /api/promocodes/validate/:code</p></div>
        <Btn onClick={()=>{setEditing("new");setForm({code:"",discount_type:"percent",discount_value:"",min_order:"",max_uses:"",active:true,expires_at:""});}}><Plus className="h-4 w-4"/>Создать</Btn>
      </div>
      {(editing==="new"||editing?.id)&&(
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm">{editing==="new"?"Новый промокод":"Редактировать"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Код *" value={form.code} onChange={e=>set("code",e.target.value.toUpperCase())} placeholder="STROY20"/>
            <Select label="Тип скидки" value={form.discount_type} onChange={e=>set("discount_type",e.target.value)}>
              <option value="percent">% от суммы</option>
              <option value="fixed">Фиксированная (₸)</option>
            </Select>
            <Input label={form.discount_type==="percent"?"Скидка %":"Скидка ₸"} type="number" value={form.discount_value} onChange={e=>set("discount_value",e.target.value)} placeholder="10"/>
            <Input label="Мин. сумма (₸)" type="number" value={form.min_order} onChange={e=>set("min_order",e.target.value)} placeholder="0"/>
            <Input label="Макс. использований" type="number" value={form.max_uses} onChange={e=>set("max_uses",e.target.value)} placeholder="∞"/>
            <Input label="Дата окончания" type="date" value={form.expires_at} onChange={e=>set("expires_at",e.target.value)}/>
          </div>
          <Toggle label="Активен" checked={form.active} onChange={v=>set("active",v)}/>
          <div className="flex gap-2"><Btn onClick={save} loading={saving} disabled={saving}><Save className="h-4 w-4"/>Сохранить</Btn><Btn variant="ghost" onClick={()=>setEditing(null)}><X className="h-4 w-4"/>Отмена</Btn></div>
        </Card>
      )}
      {isLoading?<Spinner/>:(
        <div className="space-y-2">
          {promos.length===0&&<div className="text-center py-16 text-[#555]">Промокодов пока нет</div>}
          {promos.map(promo=>(
            <Card key={promo.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-white text-sm">{promo.code}</span>
                  <Badge color={promo.active?"green":"gray"}>{promo.active?"Активен":"Отключён"}</Badge>
                  <Badge color="blue">{promo.discount_type==="percent"?`${promo.discount_value}%`:`${promo.discount_value} ₸`}</Badge>
                  {promo.min_order&&<Badge>от {promo.min_order.toLocaleString()} ₸</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#555]">
                  <span>Использований: {promo.uses||0}{promo.max_uses?`/${promo.max_uses}`:""}</span>
                  {promo.expires_at&&<span>До: {new Date(promo.expires_at).toLocaleDateString("ru-RU")}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Toggle checked={promo.active} onChange={()=>toggleActive(promo)}/>
                <Btn variant="ghost" size="sm" onClick={()=>startEdit(promo)}><Pencil className="h-3.5 w-3.5"/></Btn>
                <Btn variant="danger" size="sm" onClick={()=>{if(confirm("Удалить?")) deleteMut.mutate(promo.id);}} loading={deleteMut.isPending}><Trash2 className="h-3.5 w-3.5"/></Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 8. LEADS (MongoDB) ──────────────────────────────────────────────────────
function LeadsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(null);

  const { data:leads=[], isLoading } = useQuery({
    queryKey: ["consultations"],
    queryFn: Consultation.list,
    refetchInterval: 30000, // poll every 30s for new leads
  });

  const updateMut = useMutation({
    mutationFn: ({id,data}) => Consultation.update(id,data),
    onSuccess: (updated) => {
      qc.invalidateQueries({queryKey:["consultations"]});
      setSel(prev => prev?.id===updated.id ? updated : prev);
      toast.success("Статус обновлён");
    },
    onError: e => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: Consultation.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:["consultations"]}); setSel(null); toast.success("Удалено"); },
    onError: e => toast.error(e.message),
  });

  const STATUS={new:{label:"Новая",color:"red"},in_progress:{label:"В работе",color:"amber"},done:{label:"Завершена",color:"green"}};
  const filtered=filter==="all"?leads:leads.filter(l=>l.status===filter);
  const newCount = leads.filter(l=>l.status==="new").length;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Заявки с форм
            {newCount>0&&<span className="text-xs bg-[#C0392B] text-white px-2 py-0.5 rounded-full animate-pulse">{newCount} новых</span>}
          </h2>
          <p className="text-sm text-[#555]">MongoDB · обновляется каждые 30 сек</p>
        </div>
        <div className="flex gap-2">
          {[["all","Все"],["new","Новые"],["in_progress","В работе"],["done","Завершены"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filter===v?"bg-[#C0392B] text-white":"bg-[#1e1e1e] text-[#888] hover:text-white"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {isLoading?<Spinner/>:filtered.map(lead=>(
            <Card key={lead.id} className={`px-4 py-3 cursor-pointer hover:border-[#C0392B]/40 transition-colors ${sel?.id===lead.id?"border-[#C0392B]/50":""}`} onClick={()=>setSel(lead)}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${lead.status==="new"?"bg-[#C0392B] animate-pulse":lead.status==="done"?"bg-green-500":"bg-amber-500"}`}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-white">{lead.name}</span>
                    <Badge color={STATUS[lead.status]?.color||"gray"}>{STATUS[lead.status]?.label||lead.status}</Badge>
                  </div>
                  <p className="text-xs text-[#888] mt-0.5">{lead.phone}</p>
                  <p className="text-xs text-[#555] mt-1 line-clamp-2">{lead.message}</p>
                  <p className="text-xs text-[#444] mt-1">{new Date(lead.created_date).toLocaleString("ru-RU")}</p>
                </div>
              </div>
            </Card>
          ))}
          {!isLoading&&filtered.length===0&&<div className="text-center py-12 text-[#555]">Заявок нет</div>}
        </div>
        {sel?(
          <Card className="p-5 space-y-4 self-start">
            <div className="flex items-start justify-between">
              <div><h3 className="font-bold text-white">{sel.name}</h3><p className="text-xs text-[#555] mt-0.5">{sel.source||"Форма сайта"}</p></div>
              <button onClick={()=>setSel(null)} className="text-[#555] hover:text-white"><X className="h-4 w-4"/></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="text-[#555] w-20">Телефон:</span><span className="text-white">{sel.phone}</span></div>
              {sel.email&&<div className="flex items-center gap-2"><span className="text-[#555] w-20">Email:</span><span className="text-white">{sel.email}</span></div>}
              <div className="flex items-start gap-2"><span className="text-[#555] w-20 shrink-0">Сообщение:</span><span className="text-[#aaa]">{sel.message||"—"}</span></div>
              <div className="flex items-center gap-2"><span className="text-[#555] w-20">Дата:</span><span className="text-[#aaa] text-xs">{new Date(sel.created_date).toLocaleString("ru-RU")}</span></div>
            </div>
            {/* Note field */}
            <div>
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Заметка менеджера</span>
              <textarea
                defaultValue={sel.note||""}
                onBlur={e=>{ if(e.target.value!==sel.note) updateMut.mutate({id:sel.id,data:{note:e.target.value}}); }}
                rows={2}
                placeholder="Добавьте заметку..."
                className="mt-1 w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C0392B] resize-none"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Статус</p>
              <div className="flex gap-2">
                {Object.entries(STATUS).map(([v,s])=>(
                  <button key={v} onClick={()=>updateMut.mutate({id:sel.id,data:{status:v}})} disabled={updateMut.isPending}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${sel.status===v?"bg-[#C0392B] text-white":"bg-[#1e1e1e] text-[#888] hover:text-white"}`}>{s.label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <a href={`tel:${sel.phone}`} className="flex-1"><Btn variant="secondary" className="w-full justify-center">📞 Позвонить</Btn></a>
              {sel.email&&<a href={`mailto:${sel.email}`} className="flex-1"><Btn variant="ghost" className="w-full justify-center">✉️ Email</Btn></a>}
              <Btn variant="danger" size="sm" onClick={()=>{if(confirm("Удалить заявку?")) deleteMut.mutate(sel.id);}} loading={deleteMut.isPending}><Trash2 className="h-3.5 w-3.5"/></Btn>
            </div>
          </Card>
        ):(
          <div className="hidden md:flex items-center justify-center h-48 text-[#444] text-sm">Выберите заявку для просмотра</div>
        )}
      </div>
    </div>
  );
}

// ─── BANNER FORM ─────────────────────────────────────────────────────────────
function BannerForm({ slot, onClose }) {
  const qc=useQueryClient();
  const [f,setF]=useState(EMPTY_BANNER);
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  useState(()=>{Banner.get(slot).then(b=>b&&setF({...EMPTY_BANNER,...b})).catch(()=>{});});
  const save=async()=>{setSaving(true);try{await Banner.upsert(slot,f);qc.invalidateQueries({queryKey:["banner",slot]});toast.success("Баннер сохранён");onClose();}catch(e){toast.error(e.message);}setSaving(false);};
  const isTop=slot==="top";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Бейдж" value={f.badge_text||""} onChange={e=>set("badge_text",e.target.value)} placeholder="Акция"/>
        <Input label="Текст кнопки" value={f.button_text||""} onChange={e=>set("button_text",e.target.value)} placeholder="Смотреть"/>
        <div className="md:col-span-2"><Input label="Заголовок (\\n = перенос)" value={f.title||""} onChange={e=>set("title",e.target.value)}/></div>
        <div className="md:col-span-2"><Textarea label="Подзаголовок" value={f.subtitle||""} onChange={e=>set("subtitle",e.target.value)}/></div>
        <Input label="Ссылка" value={f.button_link||""} onChange={e=>set("button_link",e.target.value)} placeholder="/catalog"/>
        {isTop&&<><Input label="Подпись цены" value={f.price_label||""} onChange={e=>set("price_label",e.target.value)}/><Input label="Цена" value={f.price_value||""} onChange={e=>set("price_value",e.target.value)}/><Input label="Единица" value={f.price_unit||""} onChange={e=>set("price_unit",e.target.value)}/></>}
        <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Цвет фона</span><div className="flex items-center gap-2"><input type="color" value={f.bg_color||"#1A1A1A"} onChange={e=>set("bg_color",e.target.value)} className="h-9 w-16 rounded-lg cursor-pointer bg-transparent border border-[#2a2a2a]"/><span className="text-sm text-[#888]">{f.bg_color}</span></div></label>
        <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Акцентный цвет</span><div className="flex items-center gap-2"><input type="color" value={f.accent_color||"#C0392B"} onChange={e=>set("accent_color",e.target.value)} className="h-9 w-16 rounded-lg cursor-pointer bg-transparent border border-[#2a2a2a]"/><span className="text-sm text-[#888]">{f.accent_color}</span></div></label>
      </div>
      <div className="rounded-xl overflow-hidden p-5 flex items-center justify-between gap-4" style={{backgroundColor:f.bg_color||"#1A1A1A"}}>
        <div>{f.badge_text&&<span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1 text-white" style={{backgroundColor:f.accent_color}}>{f.badge_text}</span>}<div className="text-white font-bold text-lg">{f.title?.replace(/\\n/g,"\n").split("\n").map((l,i)=><div key={i}>{l}</div>)}</div>{f.subtitle&&<p className="text-white/60 text-xs mt-1">{f.subtitle}</p>}</div>
        {isTop&&f.price_value&&<div className="bg-white rounded-xl p-3 text-center shrink-0"><p className="text-[#5C5C5C] text-xs">{f.price_label}</p><p className="font-bold" style={{color:f.accent_color}}>{f.price_value}</p><p className="text-[#5C5C5C] text-xs">{f.price_unit}</p></div>}
      </div>
      <div className="flex gap-3"><Btn onClick={save} loading={saving} disabled={saving}><Save className="h-4 w-4"/>Сохранить</Btn><Btn variant="ghost" onClick={onClose}><X className="h-4 w-4"/>Отмена</Btn></div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(() => !!Auth.getToken && Auth.getToken?.() || false);
  const qc = useQueryClient();
  const [tab, setTab] = useState("dashboard");
  const [editingBanner, setEditingBanner] = useState(null);

  // Verify token on mount
  useState(() => {
    if (authed) {
      Auth.me().catch(() => { Auth.logout?.(); setAuthed(false); });
    }
  });

  const { data:products=[], isLoading:productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => Product.list("-created_date", 500),
    enabled: authed,
  });
  const { data:categories=[] } = useQuery({
    queryKey: ["categories"],
    queryFn: Category.list,
    enabled: authed,
  });
  const { data:leads=[] } = useQuery({
    queryKey: ["consultations"],
    queryFn: Consultation.list,
    enabled: authed,
    refetchInterval: 30000,
  });
  const { data:promos=[] } = useQuery({
    queryKey: ["promocodes"],
    queryFn: Promocode.list,
    enabled: authed,
  });

  const handleLogin = () => setAuthed(true);
  const handleLogout = () => { Auth.logout(); setAuthed(false); };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  const newLeads = leads.filter(l=>l.status==="new").length;
  const TABS = [
    {id:"dashboard",  icon:LayoutDashboard, label:"Дашборд"},
    {id:"products",   icon:Package,         label:"Товары",    badge:products.length},
    {id:"categories", icon:Tag,             label:"Категории", badge:categories.length},
    {id:"excel",      icon:FileSpreadsheet, label:"Excel"},
    {id:"promos",     icon:Ticket,          label:"Промокоды", badge:promos.filter(p=>p.active).length||undefined},
    {id:"leads",      icon:FileText,        label:"Заявки",    badge:newLeads||undefined, badgeRed:true},
    {id:"banners",    icon:Megaphone,       label:"Баннеры"},
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      <div className="border-b border-[#1e1e1e] px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#080808]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#C0392B] flex items-center justify-center font-black text-sm">А</div>
          <span className="font-bold text-lg tracking-tight">Админ-панель</span>
          <span className="text-[#555] text-sm hidden sm:inline">/ Стройдворк</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-[#555] hover:text-white transition-colors hidden sm:inline">← На сайт</a>
          <button onClick={handleLogout} className="text-xs text-[#555] hover:text-red-400 transition-colors flex items-center gap-1">
            <LogOut className="h-3 w-3"/>Выйти
          </button>
        </div>
      </div>
      <div className="border-b border-[#1e1e1e] px-4 sm:px-6 flex gap-0 overflow-x-auto">
        {TABS.map(({id,icon:Icon,label,badge,badgeRed})=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${tab===id?"border-[#C0392B] text-white":"border-transparent text-[#666] hover:text-[#aaa]"}`}>
            <Icon className="h-4 w-4"/>
            <span className="hidden sm:inline">{label}</span>
            {badge!==undefined&&<span className={`text-xs px-1.5 py-0.5 rounded-full ${badgeRed?"bg-[#C0392B] text-white animate-pulse":"bg-[#1e1e1e] text-[#888]"}`}>{badge}</span>}
          </button>
        ))}
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab==="dashboard" && <Dashboard products={products} leads={leads} promos={promos}/>}
        {tab==="products"  && <ProductsTab products={products} isLoading={productsLoading} categories={categories} qc={qc}/>}
        {tab==="categories"&& <CategoriesTab products={products}/>}
        {tab==="excel"     && <ExcelImporter categories={categories} qc={qc}/>}
        {tab==="promos"    && <PromosTab/>}
        {tab==="leads"     && <LeadsTab/>}
        {tab==="banners"   && (
          <div className="space-y-4 max-w-2xl">
            <div><h2 className="text-lg font-bold text-white">Баннеры</h2><p className="text-sm text-[#555]">Рекламные баннеры главной страницы</p></div>
            {BANNER_SLOTS.map(({slot,label})=>(
              <Card key={slot} className="overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div><p className="font-medium text-sm">{label}</p><p className="text-xs text-[#555] mt-0.5">Слот: <code className="text-[#C0392B]">{slot}</code></p></div>
                  <Btn size="sm" variant={editingBanner===slot?"ghost":"secondary"} onClick={()=>setEditingBanner(editingBanner===slot?null:slot)}>
                    {editingBanner===slot?<><X className="h-3.5 w-3.5"/>Закрыть</>:<><Pencil className="h-3.5 w-3.5"/>Редактировать</>}
                  </Btn>
                </div>
                {editingBanner===slot&&<div className="border-t border-[#1e1e1e] p-5"><BannerForm slot={slot} onClose={()=>setEditingBanner(null)}/></div>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
