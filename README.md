# UniHelp

Production-oriented fullstack platform for student mutual help inside a university. Students publish tasks, respond to tasks, select executors, move work through a strict workflow, leave reviews, and receive skill-based recommendations.

## Stack

- Frontend: Next.js 15 App Router, React, TypeScript, TailwindCSS, React Hook Form, Zod, TanStack Query, Axios, lucide-react
- Backend: NestJS, Prisma ORM, PostgreSQL, JWT, Swagger, class-validator, bcrypt
- Infrastructure: Docker, Docker Compose, optional pgAdmin via `docker-compose.dev.yml`
- Testing: Jest unit tests for workflow rules, e2e config scaffold

## Architecture

```txt
backend/src
  auth/              JWT auth, refresh, password hashing
  users/             profile, skills, public helpers
  tasks/             task CRUD, filters, strict workflow
  responses/         task responses and withdrawal
  comments/          nested comments, soft delete, pinning
  reviews/           one review per completed task, rating recalculation
  skills/            skill catalog
  categories/        category catalog
  notifications/     domain notifications and matching-skill alerts
  analytics/         dashboard statistics
  admin/             moderation, blocking, forced status changes
  common/            guards, decorators, filters, pagination
```

```txt
frontend/src
  app/               App Router pages and protected layout
  components/ui/     reusable UI primitives
  features/tasks/    task cards and task-specific UI
  features/layout/   authenticated app shell
  lib/api.ts         typed Axios API client
```

## Core Workflow

`draft -> published -> executor_selected -> in_progress -> on_review -> completed`

Rules are enforced in `backend/src/tasks/workflow.ts` and in transactional services:

- no status jumps;
- draft tasks are visible only to owner or admin;
- students cannot respond to their own task;
- executor selection accepts one response and rejects others in one transaction;
- only executor can send work to review;
- only customer can approve work or request rework;
- review is allowed only after completion and only once per task;
- helper rating is recalculated from `AVG(review.rating)`;
- completed counter counts only completed, non-deleted executor tasks.

## Run Locally

```bash
cp .env.example .env
docker compose up -d postgres

cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

cd ../frontend
npm install
npm run dev
```

URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs

Seed accounts:

- `admin@university.ru` / `admin12345`
- `anna@university.ru` / `student12345`
- `pavel@university.ru` / `student12345`

## Verification

```bash
cd backend
npm run build
npm test -- --runInBand

cd ../frontend
npm run build
```

## Implemented Requirements

- Prisma schema with enums, relations, indexes, soft delete, audit timestamps, history tables, notifications, achievements, complaints.
- REST API with Swagger, validation DTOs, RBAC guard, centralized error filter, rate limiting, Helmet and CORS.
- Task filters: category, skills, status, search, active only, my tasks, deadline within next 24h, pagination and sorting.
- Frontend pages: landing, login, register, dashboard, task feed, task details, create task, edit placeholder, my tasks, completed tasks, my responses, profile, settings, notifications, admin dashboard.
- Dockerfiles for frontend/backend and compose files for production-style and dev database setup.
