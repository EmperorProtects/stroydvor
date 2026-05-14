import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export const translations = {
  ru: {
    // Навигация
    catalog: "Каталог", about: "О нас", contacts: "Контакты", home: "Главная",
    search: "Найти", searchPlaceholder: "Поиск...",
    // Корзина / оформление
    cart: "Корзина", favorites: "Избранное",
    checkout: "Оформление заказа", backToCart: "Вернуться в корзину",
    contactInfo: "Контактные данные",
    name: "Имя", phone: "Телефон", address: "Адрес доставки", comment: "Комментарий",
    promo: "Промокод", applyPromo: "Применить",
    promoApplied: "Промокод введён! Скидка",
    yourOrder: "Ваш заказ",
    delivery: "Доставка", pickup: "Самовывоз",
    deliveryMethod: "Способ получения", paymentMethod: "Способ оплаты",
    payKaspi: "Kaspi QR", payRemote: "Удалённая оплата", payLegal: "Для юр. лиц (счёт)",
    free: "Бесплатно", total: "Итого",
    toPayment: "Перейти к оплате →", processing: "Оформляем...",
    privacyNote: "Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности",
    deliveryDisabled: "Доставка временно недоступна. Доступен только самовывоз.",
    deliveryPrice: "Стоимость доставки", freeFrom: "Бесплатно от",
    addressRequired: "Укажите адрес доставки",
    products: "товаров", discount: "Скидка",
    navigation: "Навигация", allRights: "Все права защищены.",
    // Карточки товаров
    inStock: "В наличии", outOfStock: "Нет в наличии", onOrder: "Под заказ",
    addToCart: "В корзину", placeOrder: "Оформить заказ", noPhoto: "Нет фото",
    brand: "Бренд", sale: "АКЦИЯ", featured: "ХИТ",
    backToCatalog: "Назад в каталог",
    // Категории
    allCategories: "Весь каталог →",
    categoriesTitle: "Категории товаров",
    subcategories: "Подкатегории",
    showMore: "Ещё", collapse: "Свернуть",
    // Страница товара
    guarantee: "Гарантия качества",
    deliveryTime: "Доставка от 2 часов по Астане",
    returnPolicy: "Возврат в течение 14 дней",
    productNotFound: "Товар не найден",
    backToCatalogBtn: "Вернуться в каталог",
    relatedProducts: "Похожие товары",
    // Футер
    phones: "Телефоны отделов",
    workHours: "Режим работы",
    // Фильтры каталога
    filterTitle: "Фильтры", all: "Все", priceFrom: "Цена от", priceTo: "до",
    apply: "Применить", reset: "Сбросить",
    sortBy: "Сортировка", sortNew: "Новые", sortPrice: "По цене", sortSale: "Акции",
    noProducts: "Товары не найдены",
    orders: "Заказы", myOrders: "Мои заказы", cabinet: "Кабинет",
  },
  kz: {
    catalog: "Каталог", about: "Біз туралы", contacts: "Байланыс", home: "Басты бет",
    search: "Іздеу", searchPlaceholder: "Іздеу...",
    cart: "Себет", favorites: "Таңдаулылар",
    checkout: "Тапсырысты рәсімдеу", backToCart: "Себетке оралу",
    contactInfo: "Байланыс деректері",
    name: "Аты", phone: "Телефон", address: "Жеткізу мекенжайы", comment: "Түсініктеме",
    promo: "Промокод", applyPromo: "Қолдану",
    promoApplied: "Промокод қолданылды! Жеңілдік",
    yourOrder: "Тапсырысыңыз",
    delivery: "Жеткізу", pickup: "Өздігінен алу",
    deliveryMethod: "Алу әдісі", paymentMethod: "Төлем әдісі",
    payKaspi: "Kaspi QR", payRemote: "Қашықтан төлем", payLegal: "Заңды тұлғалар үшін (шот)",
    free: "Тегін", total: "Барлығы",
    toPayment: "Төлемге өту →", processing: "Рәсімдеуде...",
    privacyNote: "Түймені басу арқылы құпиялылық саясатымен келісесіз",
    deliveryDisabled: "Жеткізу уақытша қолжетімсіз. Тек өздігінен алу мүмкін.",
    deliveryPrice: "Жеткізу құны", freeFrom: "Бастап тегін",
    addressRequired: "Жеткізу мекенжайын енгізіңіз",
    products: "тауар", discount: "Жеңілдік",
    navigation: "Навигация", allRights: "Барлық құқықтар қорғалған.",
    inStock: "Бар", outOfStock: "Жоқ", onOrder: "Тапсырыспен",
    addToCart: "Себетке", placeOrder: "Тапсырыс беру", noPhoto: "Сурет жоқ",
    brand: "Бренд", sale: "АКЦИЯ", featured: "ХИТ",
    backToCatalog: "Каталогқа оралу",
    allCategories: "Барлық каталог →",
    categoriesTitle: "Тауар санаттары",
    subcategories: "Ішкі санаттар",
    showMore: "Тағы", collapse: "Жию",
    guarantee: "Сапа кепілдігі",
    deliveryTime: "Астана бойынша 2 сағаттан жеткізу",
    returnPolicy: "14 күн ішінде қайтару",
    productNotFound: "Тауар табылмады",
    backToCatalogBtn: "Каталогқа оралу",
    relatedProducts: "Ұқсас тауарлар",
    phones: "Бөлімдер телефондары",
    workHours: "Жұмыс уақыты",
    filterTitle: "Сүзгілер", all: "Барлығы", priceFrom: "Бағадан", priceTo: "дейін",
    apply: "Қолдану", reset: "Тазалау",
    sortBy: "Сұрыптау", sortNew: "Жаңалар", sortPrice: "Бағасы бойынша", sortSale: "Акциялар",
    noProducts: "Тауарлар табылмады",
    orders: "Тапсырыстар", myOrders: "Менің тапсырыстарым", cabinet: "Кабинет",
  },
  en: {
    catalog: "Catalog", about: "About Us", contacts: "Contacts", home: "Home",
    search: "Search", searchPlaceholder: "Search...",
    cart: "Cart", favorites: "Favorites",
    checkout: "Checkout", backToCart: "Back to Cart",
    contactInfo: "Contact Details",
    name: "Name", phone: "Phone", address: "Delivery Address", comment: "Comment",
    promo: "Promo Code", applyPromo: "Apply",
    promoApplied: "Promo applied! Discount",
    yourOrder: "Your Order",
    delivery: "Delivery", pickup: "Pickup",
    deliveryMethod: "Delivery Method", paymentMethod: "Payment Method",
    payKaspi: "Kaspi QR", payRemote: "Remote Payment", payLegal: "For Legal Entities (invoice)",
    free: "Free", total: "Total",
    toPayment: "Proceed to Payment →", processing: "Processing...",
    privacyNote: "By clicking the button, you agree to the privacy policy",
    deliveryDisabled: "Delivery is temporarily unavailable. Pickup only.",
    deliveryPrice: "Delivery cost", freeFrom: "Free from",
    addressRequired: "Please enter delivery address",
    products: "items", discount: "Discount",
    navigation: "Navigation", allRights: "All rights reserved.",
    inStock: "In Stock", outOfStock: "Out of Stock", onOrder: "On Order",
    addToCart: "Add to Cart", placeOrder: "Place Order", noPhoto: "No photo",
    brand: "Brand", sale: "SALE", featured: "HIT",
    backToCatalog: "Back to Catalog",
    allCategories: "All categories →",
    categoriesTitle: "Product Categories",
    subcategories: "Subcategories",
    showMore: "More", collapse: "Collapse",
    guarantee: "Quality Guarantee",
    deliveryTime: "Delivery in 2 hours across Astana",
    returnPolicy: "Returns within 14 days",
    productNotFound: "Product not found",
    backToCatalogBtn: "Back to catalog",
    relatedProducts: "Related Products",
    phones: "Department Phones",
    workHours: "Working Hours",
    filterTitle: "Filters", all: "All", priceFrom: "Price from", priceTo: "to",
    apply: "Apply", reset: "Reset",
    sortBy: "Sort by", sortNew: "Newest", sortPrice: "By price", sortSale: "Sales",
    noProducts: "No products found",
    orders: "Orders", myOrders: "My Orders", cabinet: "Account",
  },
};

/** Вернуть локализованное поле объекта: obj.title_kz → fallback obj.title_ru → obj.title */
export function getLocalizedField(obj, field, lang) {
  if (!obj) return "";
  return obj[`${field}_${lang}`] || obj[`${field}_ru`] || obj[field] || "";
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "ru");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    // Меняем html lang атрибут для SEO
    document.documentElement.setAttribute("lang", lang === "kz" ? "kk" : lang);
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.ru[key] || key;

  // Хелпер для локализации объектов прямо через контекст
  const tField = (obj, field) => getLocalizedField(obj, field, lang);

  return (
    <AppContext.Provider value={{ theme, setTheme, lang, setLang, t, tField }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
