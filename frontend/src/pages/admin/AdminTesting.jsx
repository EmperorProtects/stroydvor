import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, User, ShoppingCart, Search, Star, Package, CreditCard, AlertTriangle } from "lucide-react";

const customerJourney = [
  {
    stage: "Знакомство",
    color: "#3B82F6",
    icon: User,
    description: "Пользователь впервые попадает на сайт",
    steps: [
      "Открыть главную страницу — убедиться что загружается баннер-слайдер",
      "Проверить отображение промо-карточек под слайдером",
      "Убедиться что секции рекомендуемых товаров показываются",
      "Проверить блок «Категории товаров» — должны отображаться все категории с подкатегориями",
    ],
  },
  {
    stage: "Поиск товара",
    color: "#8B5CF6",
    icon: Search,
    description: "Пользователь ищет нужный товар",
    steps: [
      "Нажать на категорию с главной страницы — перейти на страницу категории",
      "Убедиться что подкатегории отображаются сеткой с картинками",
      "На мобильном устройстве: проверить список подкатегорий",
      "Нажать на подкатегорию — перейти к списку товаров",
      "Ввести запрос в поиск — убедиться что переход на /catalog?search=... работает",
      "Перейти в /catalog — проверить список всех категорий",
    ],
  },
  {
    stage: "Просмотр товара",
    color: "#10B981",
    icon: Package,
    description: "Пользователь изучает карточку товара",
    steps: [
      "Нажать на карточку товара — открыть страницу /product/:id",
      "Проверить что фото, название, цена, описание отображаются корректно",
      "Убедиться что кнопка «В корзину» работает",
      "Добавить в избранное — проверить счётчик в хедере",
      "Проверить раздел «Похожие товары»",
    ],
  },
  {
    stage: "Корзина",
    color: "#F59E0B",
    icon: ShoppingCart,
    description: "Пользователь формирует заказ",
    steps: [
      "Перейти в корзину (/cart) — проверить список добавленных товаров",
      "Изменить количество товара — пересчёт суммы должен срабатывать",
      "Удалить товар из корзины",
      "Применить промокод (если настроен)",
      "Убедиться что отображается итоговая сумма и информация о доставке",
    ],
  },
  {
    stage: "Оформление заказа",
    color: "#EF4444",
    icon: CreditCard,
    description: "Пользователь оплачивает заказ",
    steps: [
      "Нажать «Оформить заказ» — перейти на /checkout",
      "Заполнить имя, телефон, адрес доставки",
      "Проверить итоговую сумму в блоке справа",
      "Нажать «Подтвердить заказ» — проверить появление Kaspi QR",
      "Убедиться что заказ появился в Админ → Заказы",
      "Проверить что корзина очистилась после заказа",
    ],
  },
  {
    stage: "Избранное",
    color: "#EC4899",
    icon: Star,
    description: "Пользователь управляет избранным",
    steps: [
      "Перейти в /favorites",
      "Проверить список сохранённых товаров",
      "Нажать «В корзину» из избранного",
      "Удалить товар из избранного",
    ],
  },
];

const adminChecklist = [
  {
    section: "Баннеры",
    color: "#3B82F6",
    tasks: [
      "Создать новый слайд (тип: Слайдер) — заполнить заголовок, подзаголовок, текст кнопки, URL изображения",
      "Проверить что слайд появился на главной странице",
      "Создать мини-карточку (тип: Мини-карточка) — проверить под слайдером",
      "Скрыть баннер — убедиться что исчез с главной",
      "Удалить тестовый баннер",
    ],
  },
  {
    section: "Товары",
    color: "#10B981",
    tasks: [
      "Создать новый товар вручную — заполнить все поля",
      "Проверить что товар появился в каталоге",
      "Загрузить товары из Excel (скачать шаблон → заполнить → загрузить)",
      "Отредактировать цену существующего товара",
      "Удалить тестовый товар",
    ],
  },
  {
    section: "Категории",
    color: "#8B5CF6",
    tasks: [
      "Создать новую родительскую категорию с изображением",
      "Добавить подкатегорию к ней (указать родительскую)",
      "Проверить что категория появилась в /catalog",
      "Перейти в категорию — убедиться в правильном отображении подкатегорий",
      "Деактивировать категорию — убедиться что скрылась",
    ],
  },
  {
    section: "Рекомендуемые секции",
    color: "#F59E0B",
    tasks: [
      "Создать новую секцию с названием",
      "Добавить товары в секцию через поиск",
      "Проверить что секция появилась на главной странице",
      "Скрыть секцию — убедиться что исчезла",
    ],
  },
  {
    section: "Заказы",
    color: "#EF4444",
    tasks: [
      "Создать тестовый заказ через сайт",
      "Открыть заказ в Админ → Заказы",
      "Изменить статус заказа (Новый → Подтверждён → В доставке → Выполнен)",
      "Проверить фильтрацию заказов по статусу",
    ],
  },
];

function JourneyStage({ stage, expanded, onToggle, checkedItems, onCheck }) {
  const Icon = stage.icon;
  const total = stage.steps.length;
  const done = stage.steps.filter((_, i) => checkedItems[`${stage.stage}-${i}`]).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: stage.color + "20" }}>
          <Icon className="h-5 w-5" style={{ color: stage.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-foreground">{stage.stage}</p>
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: done === total ? "#10B981" : stage.color }}>
              {done}/{total}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
          {stage.steps.map((step, i) => {
            const key = `${stage.stage}-${i}`;
            const checked = !!checkedItems[key];
            return (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5 shrink-0" onClick={() => onCheck(key, !checked)}>
                  {checked
                    ? <CheckCircle2 className="h-5 w-5" style={{ color: stage.color }} />
                    : <Circle className="h-5 w-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  }
                </div>
                <span className={`text-sm leading-relaxed transition-colors ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {step}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminTask({ task, checked, onCheck }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group py-2 border-b border-border last:border-0">
      <div className="mt-0.5 shrink-0" onClick={() => onCheck(!checked)}>
        {checked
          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
          : <Circle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        }
      </div>
      <span className={`text-sm leading-relaxed ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {task}
      </span>
    </label>
  );
}

export default function AdminTesting() {
  const [expandedStage, setExpandedStage] = useState(null);
  const [journeyChecks, setJourneyChecks] = useState({});
  const [adminChecks, setAdminChecks] = useState({});
  const [activeTab, setActiveTab] = useState("journey");

  const totalJourney = customerJourney.reduce((s, st) => s + st.steps.length, 0);
  const doneJourney = Object.values(journeyChecks).filter(Boolean).length;

  const totalAdmin = adminChecklist.reduce((s, s2) => s + s2.tasks.length, 0);
  const doneAdmin = Object.values(adminChecks).filter(Boolean).length;

  const resetAll = () => {
    setJourneyChecks({});
    setAdminChecks({});
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Тестирование и путь клиента</h1>
          <p className="text-gray-500 text-sm mt-1">Пошаговый чеклист для проверки всех функций сайта</p>
        </div>
        <button
          onClick={resetAll}
          className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Сбросить всё
        </button>
      </div>

      {/* Progress cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Путь клиента</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-foreground">{doneJourney}</span>
            <span className="text-muted-foreground text-sm mb-1">/ {totalJourney} шагов</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${totalJourney ? (doneJourney / totalJourney) * 100 : 0}%`, backgroundColor: "#3B82F6" }}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Проверка админки</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-foreground">{doneAdmin}</span>
            <span className="text-muted-foreground text-sm mb-1">/ {totalAdmin} задач</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${totalAdmin ? (doneAdmin / totalAdmin) * 100 : 0}%`, backgroundColor: "#10B981" }}
            />
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Перед тестированием</p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">Убедитесь что добавлены тестовые товары, категории и баннеры. Тестируйте на десктопе и мобильном устройстве.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("journey")}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${activeTab === "journey" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Путь клиента
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${activeTab === "admin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Проверка админки
        </button>
      </div>

      {/* Journey tab */}
      {activeTab === "journey" && (
        <div className="space-y-3">
          {customerJourney.map((stage) => (
            <JourneyStage
              key={stage.stage}
              stage={stage}
              expanded={expandedStage === stage.stage}
              onToggle={() => setExpandedStage(s => s === stage.stage ? null : stage.stage)}
              checkedItems={journeyChecks}
              onCheck={(key, val) => setJourneyChecks(prev => ({ ...prev, [key]: val }))}
            />
          ))}
        </div>
      )}

      {/* Admin tab */}
      {activeTab === "admin" && (
        <div className="space-y-4">
          {adminChecklist.map((section) => {
            const total = section.tasks.length;
            const done = section.tasks.filter((_, i) => adminChecks[`${section.section}-${i}`]).length;
            return (
              <div key={section.section} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: section.color }} />
                    <h3 className="font-semibold text-foreground">{section.section}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: done === total ? "#10B981" : section.color }}>
                    {done}/{total}
                  </span>
                </div>
                <div>
                  {section.tasks.map((task, i) => {
                    const key = `${section.section}-${i}`;
                    return (
                      <AdminTask
                        key={i}
                        task={task}
                        checked={!!adminChecks[key]}
                        onCheck={(val) => setAdminChecks(prev => ({ ...prev, [key]: val }))}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}