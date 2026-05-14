/**
 * apiClient.js
 * Единое хранилище токенов: localStorage.
 *
 * Роли:
 *   admin — вход через /auth/login (username+password), role="admin" в JWT
 *   user  — вход через /auth/user/login (phone/email+password), role="user"
 *
 * _req(method, path, body, authType):
 *   'admin' — берёт токен из localStorage, проверяет что role=admin
 *   'user'  — берёт токен из localStorage, auto-refresh при 401
 *   false   — без токена (публичные эндпоинты)
 */

const BASE = import.meta.env.VITE_API_URL || '/api';

const KEYS = {
  ACCESS:  'sd_access',
  REFRESH: 'sd_refresh',
  USER:    'sd_user',
  ROLE:    'sd_role',
  LANG:    'stroydvor_lang',
  SESSION: 'sd_session',
};

// ─── Session ID для гостевой корзины ─────────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem(KEYS.SESSION);
  if (!id) {
    id = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEYS.SESSION, id);
  }
  return id;
}

// ─── JWT decode (без верификации — только для чтения payload) ─────────────────
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

// ─── i18n ─────────────────────────────────────────────────────────────────────
export const LANGS = [
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'kz', label: 'KZ', name: 'Қазақша' },
  { code: 'en', label: 'EN', name: 'English' },
];
export const getCurrentLang  = () => localStorage.getItem(KEYS.LANG) || 'ru';
export const setCurrentLang  = (code) => {
  if (['ru', 'kz', 'en'].includes(code)) {
    localStorage.setItem(KEYS.LANG, code);
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
  }
};
export const getLocalizedField = (obj, field, lang = null) => {
  const l = lang || getCurrentLang();
  if (!obj) return '';
  return obj[`${field}_${l}`] || obj[`${field}_ru`] || obj[field] || '';
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const Auth = {
  // ── Токены (единое место — localStorage) ──────────────────────────────────
  getToken:    () => localStorage.getItem(KEYS.ACCESS),
  getRefresh:  () => localStorage.getItem(KEYS.REFRESH),
  getRole:     () => {
    const tok = localStorage.getItem(KEYS.ACCESS);
    if (!tok) return null;
    return decodeJwt(tok)?.role || null;
  },
  isAdmin:     () => Auth.getRole() === 'admin',
  isUser:      () => ['user', 'admin'].includes(Auth.getRole()),
  isAuthed:    () => !!localStorage.getItem(KEYS.ACCESS),

  setTokens: (access, refresh) => {
    localStorage.setItem(KEYS.ACCESS, access);
    if (refresh) localStorage.setItem(KEYS.REFRESH, refresh);
  },
  clearTokens: () => {
    [KEYS.ACCESS, KEYS.REFRESH, KEYS.USER, KEYS.ROLE].forEach(k => localStorage.removeItem(k));
    // clear legacy sessionStorage too
    sessionStorage.removeItem('stroydvor_token');
  },

  // ── Кэш пользователя ──────────────────────────────────────────────────────
  getCachedUser: () => {
    try { return JSON.parse(localStorage.getItem(KEYS.USER) || 'null'); } catch { return null; }
  },
  setCachedUser: (u) => localStorage.setItem(KEYS.USER, JSON.stringify(u)),

  // ── Admin login (/auth/login, role=admin) ──────────────────────────────────
  adminLogin: async (username, password) => {
    const d = await _req('POST', '/auth/login', { username, password });
    // Сохраняем как обычный access-токен — role=admin внутри JWT
    Auth.setTokens(d.access_token, null);
    return d;
  },

  // ── Проверка токена (для AdminLayout) ─────────────────────────────────────
  me: async () => {
    const d = await _req('GET', '/auth/me', undefined, 'any');
    if (d) Auth.setCachedUser(d);
    return d;
  },

  // ── User register / login ─────────────────────────────────────────────────
  register: async (name, phone, email, password) => {
    const d = await _req('POST', '/auth/register', { name, phone, email, password });
    Auth.setTokens(d.access_token, d.refresh_token);
    Auth.setCachedUser(d.user);
    return d;
  },
  login: async (loginStr, password) => {
    const d = await _req('POST', '/auth/user/login', { login: loginStr, password });
    Auth.setTokens(d.access_token, d.refresh_token);
    Auth.setCachedUser(d.user);
    return d;
  },

  // ── Refresh ───────────────────────────────────────────────────────────────
  refresh: async () => {
    const rt = Auth.getRefresh();
    if (!rt) throw new Error('No refresh token');
    const d = await _req('POST', '/auth/refresh', { refresh_token: rt });
    Auth.setTokens(d.access_token);
    return d.access_token;
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  updateProfile:  (data)           => _req('PATCH', '/auth/me', data, 'any'),
  changePassword: (old_p, new_p)   => _req('PATCH', '/auth/me/password', { old_password: old_p, new_password: new_p }, 'any'),

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    const rt = Auth.getRefresh();
    if (rt) { try { await _req('POST', '/auth/logout', { refresh_token: rt }); } catch {} }
    Auth.clearTokens();
  },

  // ── Legacy aliases (чтобы не ломать AdminLayout) ──────────────────────────
  getAdminToken: () => localStorage.getItem(KEYS.ACCESS),
  logoutAdmin:   () => Auth.clearTokens(),
};

// ─── Core fetch ───────────────────────────────────────────────────────────────
let _refreshing = null;

async function _req(method, path, body, authType = false) {
  const headers = { 'Content-Type': 'application/json' };

  // Все защищённые запросы берут токен из одного места
  if (authType === 'admin' || authType === 'user' || authType === 'any' || authType === true) {
    const tok = localStorage.getItem(KEYS.ACCESS);
    if (tok) {
      headers['Authorization'] = `Bearer ${tok}`;
    } else if (authType === 'user' || authType === 'admin') {
      throw Object.assign(new Error('Not authenticated'), { status: 401 });
    }
  }

  headers['X-Session-Id'] = getSessionId();

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh только для user-запросов
  if (res.status === 401 && authType === 'user' && Auth.getRefresh()) {
    if (!_refreshing) {
      _refreshing = Auth.refresh()
        .catch(() => { Auth.clearTokens(); return null; })
        .finally(() => { _refreshing = null; });
    }
    const newToken = await _refreshing;
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retry = await fetch(`${BASE}${path}`, {
        method, headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (retry.status === 204) return null;
      if (!retry.ok) {
        const e = await retry.json().catch(() => ({ detail: retry.statusText }));
        throw Object.assign(new Error(e.detail || 'Request failed'), { status: retry.status });
      }
      return retry.json();
    }
    throw Object.assign(new Error('Session expired'), { status: 401 });
  }

  if (res.status === 401) {
    // Не чистим токен для admin — пусть AdminLayout сам решает
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(e.detail || 'Request failed'), { status: res.status, detail: e.detail });
  }
  if (res.status === 204) return null;
  return res.json();
}

function _qs(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) q.append(k, v); });
  return q.toString() ? `?${q}` : '';
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export const Product = {
  list:   (sort = '-created_date', limit = 500, lang = null) =>
    _req('GET', `/products/${_qs({ sort, limit, ...(lang ? { lang } : {}) })}`),
  filter: (params = {}, sort = '-created_date', limit = 100, lang = null) =>
    _req('GET', `/products/${_qs({ sort, limit, ...(lang ? { lang } : {}), ...params })}`),
  get:    (id, lang = null) =>
    _req('GET', `/products/${id}${_qs(lang ? { lang } : {})}`),
  create: (data)     => _req('POST',   '/products',       data, 'admin'),
  update: (id, data) => _req('PATCH',  `/products/${id}`, data, 'admin'),
  delete: (id)       => _req('DELETE', `/products/${id}`, undefined, 'admin'),
};

export const Category = {
  list:   (lang = null) => _req('GET', `/categories/${_qs(lang ? { lang } : {})}`),
  get:    (id, lang = null) => _req('GET', `/categories/${id}${_qs(lang ? { lang } : {})}`),
  create: (data)     => _req('POST',   '/categories/',      data, 'admin'),
  update: (id, data) => _req('PATCH',  `/categories/${id}`, data, 'admin'),
  delete: (id)       => _req('DELETE', `/categories/${id}`, undefined, 'admin'),
};

export const CartItem = {
  list:   ()         => _req('GET',    '/cart/'),
  create: (data)     => _req('POST',   '/cart/', data),
  update: (id, data) => _req('PATCH',  `/cart/${id}`, data),
  delete: (id)       => _req('DELETE', `/cart/${id}`),
  clear:  ()         => _req('DELETE', '/cart/'),
};

export const Order = {
  // Админ: все заказы
  list:    ()         => _req('GET',   '/orders/',          undefined, 'admin'),
  // Пользователь: только свои
  myList:  ()         => _req('GET',   '/orders/my',        undefined, 'user'),
  get:     (id)       => _req('GET',   `/orders/${id}`),
  create:  (data)     => _req('POST',  '/orders/',  data, 'any'),  // 'any' — токен если есть, но не обязателен
  update:  (id, data) => _req('PATCH', `/orders/${id}`, data, 'admin'),
};

export const Consultation = {
  create: (data)     => _req('POST',   '/consultations/', data),
  list:   ()         => _req('GET',    '/consultations/', undefined, 'admin'),
  update: (id, data) => _req('PATCH',  `/consultations/${id}`, data, 'admin'),
  delete: (id)       => _req('DELETE', `/consultations/${id}`, undefined, 'admin'),
};

export const PromoBanner = {
  list:   (sort = null) => _req('GET', `/banners/${_qs(sort ? { sort } : {})}`),
  create: (data)        => _req('POST',   '/banners/', data, 'admin'),
  update: (id, data)    => _req('PATCH',  `/banners/${id}`, data, 'admin'),
  delete: (id)          => _req('DELETE', `/banners/${id}`, undefined, 'admin'),
};
export const Banner = PromoBanner;

export const Favorite = {
  list:   ()     => _req('GET',    '/favorites/'),
  create: (data) => _req('POST',   '/favorites/', data),
  delete: (id)   => _req('DELETE', `/favorites/${id}`),
};

export const FeaturedSection = {
  list:   ()         => _req('GET', '/featured-sections/'),
  create: (data)     => _req('POST',   '/featured-sections/', data, 'admin'),
  update: (id, data) => _req('PATCH',  `/featured-sections/${id}`, data, 'admin'),
  delete: (id)       => _req('DELETE', `/featured-sections/${id}`, undefined, 'admin'),
};

export const DeliverySettings = {
  list:   ()         => _req('GET',    '/delivery-settings/'),
  create: (data)     => _req('POST',   '/delivery-settings/', data, 'admin'),
  update: (id, data) => _req('PATCH',  `/delivery-settings/${id}`, data, 'admin'),
  delete: (id)       => _req('DELETE', `/delivery-settings/${id}`, undefined, 'admin'),
};

export const Promocode = {
  list:     ()         => _req('GET',    '/promocodes/', undefined, 'admin'),
  validate: (code)     => _req('GET',    `/promocodes/validate/${code}`),
  create:   (data)     => _req('POST',   '/promocodes/', data, 'admin'),
  update:   (id, data) => _req('PATCH',  `/promocodes/${id}`, data, 'admin'),
  delete:   (id)       => _req('DELETE', `/promocodes/${id}`, undefined, 'admin'),
};

export const SiteSettings = {
  get:  ()     => _req('GET', '/settings/'),
  save: (data) => _req('PUT', '/settings/', data, 'admin'),
};

export const Users = {
  list:   ()         => _req('GET',   '/auth/users',       undefined, 'admin'),
  update: (id, data) => _req('PATCH', `/auth/users/${id}`, data,      'admin'),
};

// ─── base44 compatibility ─────────────────────────────────────────────────────
export const base44 = {
  entities: {
    Product, Category, CartItem, Order, PromoBanner, Banner,
    Favorite, FeaturedSection, DeliverySettings, Promocode,
  },
  auth: Auth,
};

export default base44;
