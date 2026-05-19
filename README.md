# UniHelp — Платформа студенческой взаимопомощи

Веб-приложение для бесплатного обмена помощью внутри университета. Студенты публикуют задачи, откликаются на задачи других и оценивают исполнителей.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | NestJS + TypeScript |
| ORM | Prisma 5 |
| База данных | PostgreSQL 16 |
| Аутентификация | JWT (passport-jwt) |
| API документация | Swagger / OpenAPI |
| Frontend | Next.js 14 (App Router) |
| UI | Tailwind CSS |
| Состояние | TanStack Query v5 |
| Формы | react-hook-form + zod |
| Контейнеризация | Docker + Docker Compose |

---

## Быстрый старт

### Требования
- Docker и Docker Compose
- (опционально) Node.js 20+ для локальной разработки

### Запуск через Docker

```bash
# 1. Клонировать репозиторий
git clone <repo_url>
cd project

# 2. Создать .env файл
cp .env.example .env
# При необходимости отредактировать .env

# 3. Запустить все сервисы
docker compose up -d

# 4. Применить миграции и сид данные
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx ts-node prisma/seed.ts
```

После запуска:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger UI: http://localhost:3001/api/docs

### Локальная разработка (без Docker)

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts     # заполнить справочники
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Структура проекта

```
project/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Схема БД
│   │   └── seed.ts              # Начальные данные
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma/              # PrismaService (global)
│       ├── auth/                # Регистрация, логин, JWT
│       ├── students/            # Профили, навыки
│       ├── tasks/               # CRUD задач, workflow статусов
│       ├── responses/           # Отклики на задачи
│       ├── comments/            # Комментарии к задачам
│       ├── reviews/             # Отзывы по завершённым задачам
│       ├── skills/              # Справочник навыков
│       └── categories/          # Справочник категорий
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx             # Главная страница
        │   ├── login/page.tsx       # Вход
        │   ├── register/page.tsx    # Регистрация
        │   ├── tasks/
        │   │   ├── page.tsx         # Список задач с фильтрами
        │   │   ├── new/page.tsx     # Создание задачи
        │   │   └── [id]/page.tsx    # Страница задачи
        │   ├── my-tasks/page.tsx    # Мои задачи
        │   ├── profile/page.tsx     # Мой профиль
        │   └── students/[id]/       # Публичный профиль студента
        ├── components/
        │   ├── Navbar.tsx
        │   └── TaskCard.tsx
        ├── contexts/
        │   └── AuthContext.tsx
        └── lib/
            └── api.ts               # Axios клиент + все API методы
```

---

## Бизнес-логика

### Жизненный цикл задачи

```
draft → published → executor_selected → in_progress → on_review → completed
```

| Статус | Кто переводит | Что происходит |
|--------|--------------|----------------|
| `draft` | Автоматически при создании | Задача видна только заказчику |
| `published` | Заказчик | Задача видна всем, можно откликаться |
| `executor_selected` | Заказчик (через выбор из откликов) | Все остальные отклики отклоняются |
| `in_progress` | Заказчик | Исполнитель работает |
| `on_review` | Заказчик | Проверка результата |
| `completed` | Заказчик | Задача завершена, можно оставить отзыв |

### Правила откликов
- Нельзя откликнуться на собственную задачу
- Только одна активная задача → отклик уникален (taskId + responderId)
- После выбора исполнителя остальные отклики автоматически отклоняются

### Отзывы
- Только заказчик оставляет отзыв исполнителю
- Только по завершённым задачам
- Один отзыв на задачу
- Рейтинг 1–5 звёзд + текстовый комментарий

---

## API эндпоинты

### Auth
```
POST /api/auth/register    — регистрация
POST /api/auth/login       — вход, возвращает JWT
```

### Students
```
GET  /api/students/me                — мой профиль (auth)
GET  /api/students/top               — топ по рейтингу
GET  /api/students/:id               — публичный профиль
POST /api/students/me/skills/:skillId — добавить навык (auth)
DELETE /api/students/me/skills/:skillId — удалить навык (auth)
GET  /api/students/:id/reviews       — отзывы о студенте
```

### Tasks
```
GET  /api/tasks                      — список с фильтрами (?search, ?categoryId, ?skillId, ?page, ?limit)
GET  /api/tasks/my                   — мои задачи (auth)
GET  /api/tasks/recommended          — рекомендованные по навыкам (auth)
GET  /api/tasks/:id                  — задача по ID
POST /api/tasks                      — создать задачу (auth)
PATCH /api/tasks/:id                 — обновить черновик (auth)
DELETE /api/tasks/:id                — мягкое удаление (auth)
POST /api/tasks/:id/advance-status   — следующий статус (auth)
POST /api/tasks/:id/select-executor/:executorId — выбрать исполнителя (auth)
```

### Responses
```
POST   /api/tasks/:taskId/responses  — откликнуться (auth)
GET    /api/tasks/:taskId/responses  — отклики по задаче (только заказчик)
DELETE /api/responses/:id            — отозвать отклик (auth)
```

### Comments
```
POST   /api/tasks/:taskId/comments   — добавить комментарий (auth)
GET    /api/tasks/:taskId/comments   — комментарии задачи
DELETE /api/comments/:id             — удалить комментарий (auth)
```

### Reviews
```
POST /api/tasks/:taskId/review       — оставить отзыв (auth, заказчик)
```

### Справочники
```
GET /api/categories    — все категории
GET /api/skills        — все навыки
```

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `POSTGRES_USER` | Пользователь БД | `uni_help` |
| `POSTGRES_PASSWORD` | Пароль БД | `uni_help_pass` |
| `POSTGRES_DB` | Имя БД | `uni_help` |
| `JWT_SECRET` | Секрет для JWT | ⚠️ Поменяйте! |
| `JWT_EXPIRES_IN` | Срок жизни токена | `7d` |
| `NEXT_PUBLIC_API_URL` | URL backend для frontend | `http://localhost:3001` |

---

## Демо-аккаунт

После `prisma/seed.ts`:
- Email: `admin@university.ru`
- Пароль: `admin123`
