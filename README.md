# Стройдвор (stroydvor)

Полнофункциональный веб‑проект для магазина строительных товаров:
- **Frontend**: React + Vite (папка `frontend`)
- **Backend**: FastAPI + MongoDB (папка `backend`)

## Структура репозитория

```text
stroydvor/
├── backend/   # FastAPI API, auth, каталог, заказы, админ-функции
└── frontend/  # React-приложение (витрина + личный кабинет + админка)
```

## Требования

- Node.js 18+
- npm 9+
- Python 3.10+
- MongoDB 6+

## Быстрый старт

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Запустите API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступен по адресу `http://localhost:8000`, документация — `http://localhost:8000/docs`.

### 2) Frontend

```bash
cd frontend
npm install
```

Создайте файл `.env.local` (или `.env`) в папке `frontend`:

```env
VITE_API_URL=http://localhost:8000/api
```

Запустите frontend:

```bash
npm run dev
```

По умолчанию приложение стартует на `http://localhost:5173`.

## Полезные команды

### Frontend (`frontend`)

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

### Backend (`backend`)

```bash
uvicorn app.main:app --reload
python seed.py
python seed_banners.py
```

## Основные возможности

- Каталог товаров с категориями и фильтрацией
- Корзина и оформление заказа
- Регистрация и авторизация пользователей
- Личный кабинет и список заказов
- Админ-панель (товары, категории, баннеры, промокоды, заказы, настройки)

## Примечания

- Значения по умолчанию для admin-настроек задаются в `backend/.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD_*`).
- Перед деплоем обязательно замените `SECRET_KEY` в `backend/.env`.
