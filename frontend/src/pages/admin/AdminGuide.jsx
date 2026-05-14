import { BookOpen, Package, Image, Layers, ShoppingBag, Star, FileSpreadsheet, CheckCircle } from "lucide-react";

const sections = [
  {
    icon: Image,
    title: "Рекламные баннеры",
    color: "#8B5CF6",
    steps: [
      "Перейдите в раздел «Баннеры»",
      "Нажмите «Новый баннер»",
      "Заполните заголовок, подзаголовок и текст кнопки",
      "Вставьте URL изображения (рекомендуемый размер: 1400×400 px)",
      "Выберите цвет фона для текстового блока",
      "Укажите ссылку кнопки (например /catalog или /catalog?cat=Кровля)",
      "Установите порядок сортировки (0 — первый)",
      "Нажмите «Сохранить» — баннер появится на главной странице"
    ],
    tips: "Используйте контрастные изображения. Текст на баннере должен быть кратким — 3-6 слов в заголовке."
  },
  {
    icon: Package,
    title: "Товары — ручное добавление",
    color: "#3B82F6",
    steps: [
      "Перейдите в раздел «Товары»",
      "Нажмите «Добавить товар»",
      "Заполните название, цену и выберите категорию (обязательно)",
      "Добавьте бренд, описание, единицу измерения",
      "Вставьте URL изображения товара",
      "Отметьте «В наличии» если товар доступен",
      "Отметьте «Рекомендуемый» чтобы показать в блоке рекомендаций",
      "Нажмите «Сохранить»"
    ],
    tips: "URL изображения можно взять из Google Images (ПКМ → Копировать адрес изображения) или загрузить на imgur.com."
  },
  {
    icon: FileSpreadsheet,
    title: "Товары — импорт через Excel",
    color: "#10B981",
    steps: [
      "Нажмите «Шаблон Excel» — скачается файл-образец",
      "Откройте файл в Excel или Google Sheets",
      "Заполните строки: каждая строка = один товар",
      "Обязательные колонки: title, price, category",
      "Сохраните файл в формате .xlsx или .csv",
      "Нажмите «Импорт Excel» и выберите файл",
      "Дождитесь сообщения «Импортировано N товаров»"
    ],
    tips: "Допустимые категории: Кровля, Фасады, Изоляция, Пиломатериалы, Инструменты, Крепёж, Сухие смеси, Сантехника. Для поля in_stock используйте TRUE/FALSE.",
    tableExample: [
      ["title", "price", "category", "unit", "brand", "in_stock"],
      ["Металлочерепица", "2500", "Кровля", "м²", "Grand Line", "TRUE"],
      ["Цемент М400", "3200", "Сухие смеси", "кг", "ЦЕМ", "TRUE"],
    ]
  },
  {
    icon: Layers,
    title: "Категории и подкатегории",
    color: "#F59E0B",
    steps: [
      "Перейдите в «Категории»",
      "Нажмите «Новая категория»",
      "Введите название (например: «Металлочерепица»)",
      "В поле «Родительская категория» выберите «Кровля»",
      "Добавьте URL изображения (необязательно)",
      "Установите порядок сортировки",
      "На главной странице эта подкатегория появится в карточке «Кровля»",
      "Используйте стрелки ↑↓ для изменения порядка"
    ],
    tips: "Если подкатегорий больше 5 — на сайте появится кнопка «Показать все» для раскрытия полного списка."
  },
  {
    icon: Star,
    title: "Рекомендуемые секции",
    color: "#C0392B",
    steps: [
      "Перейдите в «Рекомендуемые секции» (иконка звезды в меню)",
      "Нажмите «Новая секция»",
      "Введите название (например: «Всё для Дачи и Дома»)",
      "В поиске найдите и выберите нужные товары (✓ появится на карточке)",
      "Можно добавить любое количество товаров",
      "На главной странице они будут прокручиваться по 4 в ряд",
      "Нажмите «Сохранить»"
    ],
    tips: "Обновляйте секции сезонно — летом «Дача и сад», зимой «Утепление и кровля»."
  },
  {
    icon: ShoppingBag,
    title: "Управление заказами",
    color: "#6366F1",
    steps: [
      "Перейдите в раздел «Заказы»",
      "Новые заказы выделены синим статусом «Новый»",
      "Нажмите на заказ чтобы раскрыть детали",
      "Просмотрите товары, адрес и комментарий клиента",
      "Измените статус: Подтверждён → Доставка → Завершён",
      "Для отмены выберите статус «Отменён»",
      "Фильтруйте заказы по статусу с помощью кнопок вверху"
    ],
    tips: "Клиент ожидает звонка после оформления. Связывайтесь в течение 30 минут для подтверждения."
  }
];

export default function AdminGuide() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold">Инструкция по работе с Admin панелью</h1>
        </div>
        <p className="text-muted-foreground">Пошаговые руководства по управлению всеми разделами сайта</p>
      </div>

      <div className="space-y-6">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border" style={{ backgroundColor: s.color + "18" }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "30" }}>
                  <Icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <h2 className="font-bold text-lg">{s.title}</h2>
              </div>
              <div className="p-6">
                <div className="space-y-2 mb-4">
                  {s.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: s.color, minWidth: "20px" }}>
                        <span className="text-white text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{step}</p>
                    </div>
                  ))}
                </div>

                {s.tableExample && (
                  <div className="mb-4 overflow-x-auto">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Пример таблицы:</p>
                    <table className="text-xs border border-border rounded-lg overflow-hidden">
                      {s.tableExample.map((row, ri) => (
                        <tr key={ri} className={ri === 0 ? "bg-secondary font-semibold" : "bg-card"}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 border border-border">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </table>
                  </div>
                )}

                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <CheckCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300"><span className="font-semibold">Совет:</span> {s.tips}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}