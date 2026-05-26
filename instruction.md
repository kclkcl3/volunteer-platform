Ты senior fullstack engineer, UX engineer и production reviewer.

Нужно выполнить крупный набор исправлений и доработок существующего fullstack проекта платформы взаимопомощи студентов.

Стек:

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- TanStack Query
- NestJS
- Prisma
- PostgreSQL
- JWT Auth

==================================================

# ВАЖНО

==================================================

Проект уже существует.

НЕ переписывать с нуля.

Нужно:

- провести глубокий refactor;
- исправить баги;
- доработать UX;
- исправить workflow;
- улучшить SQL-layer;
- стабилизировать frontend/backend.

Работать production-grade подходом.

==================================================

# UI BUG — STATUS BADGE

==================================================

Сейчас статус задачи отображается криво:

- badge слишком большой;
- текст маленький;
- border-radius ломает layout.

На скриншоте видно проблему.

Нужно:

- исправить размеры badge;
- выровнять padding;
- исправить typography;
- сделать responsive status badge;
- убрать лишнюю высоту;
- привести к нормальному compact UI.

Использовать:

- inline-flex
- items-center
- proper height
- whitespace-nowrap
- rounded-full
- correct padding

==================================================

# COMMENTS SYSTEM

==================================================

Добавить полноценную систему комментариев.

Нужно:

- replies to comments;
- nested comments;
- delete comments;
- edit comments;
- timestamps;
- soft delete.

Удалять комментарии могут:

- author;
- admin.

Также:

- убрать комментарии из draft-задач.

==================================================

# RESPONSE BUTTON BUG

==================================================

Сейчас кнопка "Select" отображается даже на чужих задачах.

Исправить:

- показывать кнопку выбора исполнителя ТОЛЬКО автору задачи;
- исполнители не должны видеть select button;
- использовать proper permission checks.

==================================================

# RESPONSE FORM UX

==================================================

После отправки отклика:

- disable form;
- disable submit button;
- loading spinner;
- prevent duplicate submit;
- optimistic update optional.

==================================================

# USER PROFILE LINKS

==================================================

Добавить возможность переходить:

- на профиль автора задачи;
- на профиль автора комментария;
- на профиль автора отклика.

Все username/avatar/name должны быть clickable.

==================================================

# PROFILE PAGE

==================================================

Полностью переработать profile page.

Показывать:

- рейтинг пользователя;
- skills;
- completed tasks;
- created tasks;
- reviews from customers.

Добавить:

- editable profile;
- profile tabs;
- proper statistics.

В completed tasks показывать:

- только реально завершенные задачи.

==================================================

# TASK FEED

==================================================

Полностью починить страницу задач.

Нужно:

- исправить отображение tasks;
- исправить search;
- исправить filters;
- исправить pagination;
- исправить sorting.

Добавить filters:

- by skills;
- by categories;
- deadline < 24h;
- sort by deadline.

Поиск должен:

- искать по title;
- работать корректно;
- быть debounce-based.

==================================================

# TASK VISIBILITY

==================================================

В общем списке должны отображаться ТОЛЬКО:

- published/open tasks;
- задачи без назначенного исполнителя.

Если executor выбран:

- скрывать задачу из общего списка.

==================================================

# TASK CREATION

==================================================

При создании задачи:

- расширить список skills;
- добавить вариант "Другое";
- если выбрано "Другое" — детали пишутся в description.

Также:

- вернуть categories;
- categories должны работать корректно;
- filters по категориям должны работать.

==================================================

# TOAST NOTIFICATIONS

==================================================

Добавить полноценные toast notifications.

Нужно:

- показывать backend validation errors;
- показывать success messages;
- показывать auth errors;
- показывать workflow errors.

Примеры:

- "Нельзя откликнуться на собственную задачу"
- "Отклик успешно отправлен"
- "Недостаточно прав"
- "Сессия истекла"

Использовать:

- sonner/shadcn toast system.

==================================================

# REVIEW SYSTEM

==================================================

После принятия работы:

- заказчик должен иметь возможность поставить оценку 1–5;
- review modal/dialog;
- optional review text;
- automatic rating recalculation.

Исполнитель:

- НЕ должен видеть кнопку "Принять работу";
- исполнитель может только:
  - "Сдать решение"
  - "Отозвать отклик" (если еще не выбран).

==================================================

# AUTH / TOKEN HANDLING

==================================================

Если JWT token expired:

- automatic logout;
- redirect to /login;
- clear auth state;
- clear cached queries.

==================================================

# RESPONSE WITHDRAW

==================================================

Исполнитель может:

- отозвать свой отклик,
  ПОКА заказчик еще не выбрал исполнителя.

После выбора:

- withdraw disabled.

==================================================

# REWORK FLOW

==================================================

После проверки заказчик может:

1.

Approve:
→ completed

2.

Request rework:
→ in_progress
→ тот же исполнитель

3.

Reopen task:
→ published
→ executor removed
→ task visible again

Исполнитель:

- не должен видеть лишние workflow buttons;
- только "Сдать решение".

==================================================

# PAGES STRUCTURE

==================================================

Оставить только страницы:

1.

Профиль
Показывать:

- рейтинг
- отзывы
- completed tasks

2.

Мои созданные задачи
Включая:

- drafts
- published
- in_progress
- on_review
- completed

Добавить status filter chips/bubbles.

По умолчанию:

- все статусы активны.

3.

Задачи, над которыми я работаю
Статусы:

- responses
- in_progress
- on_review
- completed

Также:

- status chips.

==================================================

# SIDEBAR

==================================================

Нужно:

- скрыть вкладку "Панель управления";
- перевести notifications page полностью на русский язык.

==================================================

# SQL-FIRST REFACTOR

==================================================

КРИТИЧНО:

Перевести JS-like ORM queries в SQL-first approach.

Использовать:

- raw SQL;
- Prisma SQL;
- optimized joins;
- aggregate queries;
- indexes.

Особенно перевести:

- task feed;
- filters;
- profile statistics;
- ratings;
- completed tasks counters;
- search queries.

ORM использовать:

- как transport layer.

==================================================

# CODE QUALITY

==================================================

Требования:

- strict TypeScript;
- no any;
- production-grade architecture;
- reusable components;
- proper RBAC;
- loading states;
- error boundaries;
- query invalidation;
- transaction safety;
- responsive UI.

==================================================

# OUTPUT FORMAT

==================================================

Для каждой задачи:

1.

Problem analysis

2.

Root cause

3.

Backend changes

4.

Frontend changes

5.

SQL changes

6.

Permissions changes

7.

UI/UX changes

8.

Tests

9.

Definition of done

Работать поэтапно.
Не ломать существующий функционал.

