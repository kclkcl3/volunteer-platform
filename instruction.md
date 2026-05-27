Ты senior staff engineer и technical lead.

Твоя задача — провести production-grade refactoring существующего fullstack проекта платформы взаимопомощи студентов.

Проект уже существует.
НЕ переписывать его с нуля.
Работать только через incremental refactor.

==================================================

# ОБЩИЕ ПРАВИЛА

==================================================

1.

Не ломать существующий функционал.

2.

Каждое изменение должно:

- компилироваться;
- запускаться;
- проходить проверки;
- не ломать предыдущий функционал.

3.

Все изменения делать production-grade подходом.

4.

Использовать:

- strict TypeScript;
- proper RBAC;
- transaction safety;
- SQL-first approach;
- reusable architecture;
- loading states;
- error handling;
- query invalidation.

5.

Перед любым изменением:

- проанализировать текущую реализацию;
- найти root cause;
- проверить зависимости;
- убедиться, что изменение не ломает workflow.

==================================================

# TASK WORKFLOW

==================================================

Использовать workflow:

draft
→ published
→ in_progress
→ on_review
→ completed

Задачи с выбранным исполнителем:

- не должны отображаться в общем feed.

В общем списке задач показывать ТОЛЬКО:

- published/open tasks;
- без executor.

==================================================

# RESPONSES

==================================================

На странице "Мои отклики":

- добавить кнопку "Отозвать отклик".

Правила:

- response может отозвать только его author;
- withdraw доступен только пока executor не выбран;
- после выбора executor кнопка скрывается.

Также:

- после отправки response:
  - disable form;
  - disable button;
  - loading state;
  - prevent duplicate submit.

==================================================

# TASK FEED

==================================================

Полностью исправить task feed.

Исправить:

- filtering;
- search;
- sorting;
- pagination;
- query invalidation.

Добавить:

- filter by skills;
- filter by categories;
- deadline < 24h;
- sort by deadline;
- search by task title.

Фильтры должны реально работать через backend/API/SQL.

==================================================

# USER PROFILE LINKS

==================================================

Сделать переход на profile page из:

- comments;
- responses;
- task cards;
- task author;
- executor;
- reviews.

Все username/avatar/name должны быть clickable.

==================================================

# PROFILE PAGE

==================================================

В профиле отображать:

- рейтинг пользователя;
- skills;
- completed tasks;
- created tasks;
- reviews.

Completed tasks:

- показывать список задач;
- названия должны быть clickable links.

==================================================

# REVIEW SYSTEM

==================================================

Сейчас review автоматически ставит rating = 5.

Исправить:

- добавить выбор оценки от 1 до 5;
- stars/radio/select UI;
- backend validation;
- frontend validation;
- automatic rating recalculation.

==================================================

# COMMENTS SYSTEM

==================================================

Добавить:

- replies to comments;
- nested comments;
- edit comments;
- delete comments;
- soft delete.

Комментарии в draft-задачах:

- должны быть отключены.

Удалять comment могут:

- author;
- admin.

==================================================

# TASK CREATION

==================================================

При создании задачи:

- использовать categories;
- использовать skills;
- добавить option "Другое".

Если выбрано "Другое":

- детали указываются в description.

==================================================

# TOKEN HANDLING

==================================================

При expiration JWT token:

- clear auth state;
- clear cached queries;
- redirect to /login;
- показать toast:
  "Сессия истекла. Выполните вход снова."

==================================================

# TOAST NOTIFICATIONS

==================================================

Добавить toast notifications для:

- validation errors;
- auth errors;
- workflow errors;
- permission errors;
- success messages.

Примеры:

- "Отклик успешно отправлен"
- "Недостаточно прав"
- "Сессия истекла"
- "Нельзя откликнуться на собственную задачу"

Использовать:

- shadcn/sonner toast system.

==================================================

# UI/UX FIXES

==================================================

Исправить:

- status badge layout;
- spacing;
- typography;
- responsive layout;
- broken alignment.

Status badges:

- compact;
- inline-flex;
- proper padding;
- proper height;
- rounded-full;
- no oversized containers.

==================================================

# PAGES STRUCTURE

==================================================

Оставить страницы:

1.

Profile

2.

My Created Tasks
Со status chips:

- draft
- published
- in_progress
- on_review
- completed

3.

Tasks I Work On
Со status chips:

- responses
- in_progress
- on_review
- completed

Скрыть:

- dashboard/panel pages;
- лишние sidebar items.

Notifications page:

- полностью перевести на русский язык.

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
- search;
- ratings;
- profile statistics;
- completed tasks queries.

ORM использовать только как transport layer.

==================================================

# DATABASE

==================================================

Проверить:

- relations;
- indexes;
- workflow consistency;
- constraints;
- soft delete;
- updatedAt handling.

==================================================

# TESTING

==================================================

Обновить:

- workflow tests;
- permissions tests;
- response tests;
- review tests;
- filtering tests;
- auth tests.

==================================================

# IMPLEMENTATION STRATEGY

==================================================

Работать ТОЛЬКО поэтапно.

Для каждой задачи:

1. Problem analysis
2. Root cause
3. Backend changes
4. Frontend changes
5. SQL changes
6. Permission changes
7. UI/UX changes
8. Tests
9. Definition of done

Не делать giant refactor одним diff.

Каждый этап должен быть:

- завершен;
- протестирован;
- стабилен;
- не ломать предыдущие части системы.

