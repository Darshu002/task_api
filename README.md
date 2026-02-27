# Task API — Express.js + TypeScript + PostgreSQL

A fully-typed REST API for task management, built with Express.js, TypeScript, TypeORM, and JWT authentication.

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: class-validator + class-transformer
- **Testing**: Jest + Supertest

---

## Quick Start

### 1. Prerequisites

- Node.js v18+
- PostgreSQL running locally (or Docker)

### 2. Clone & Install

```bash
git clone <repo-url>
cd task-api
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=task_api

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1h
```

### 4. Create the Database

```bash
psql -U postgres -c "CREATE DATABASE task_api;"
```

> **Note:** With `synchronize: true` in development mode, TypeORM will auto-create the `tasks` table on first startup.

### 5. Run the Server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build && npm start
```

The API will be available at `http://localhost:3000`.

---

## Sample Credentials

These dummy users are built into the application for authentication:

| Username | Password    |
|----------|-------------|
| user1    | password1   |
| user2    | password2   |
| admin    | adminpass   |

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

Tests use Jest with mocked database repositories — **no real database needed to run tests**.

---

## API Overview

| Method | Endpoint        | Auth | Description                  |
|--------|-----------------|------|------------------------------|
| POST   | /auth/login     | No   | Get JWT token                |
| GET    | /health         | No   | Health check                 |
| GET    | /tasks          | Yes  | List tasks (paginated)       |
| GET    | /tasks/:id      | Yes  | Get task by ID               |
| POST   | /tasks          | Yes  | Create task                  |
| PATCH  | /tasks/:id      | Yes  | Partially update task        |
| DELETE | /tasks/:id      | Yes  | Soft delete task             |

See **[API_DOCS.md](./API_DOCS.md)** for full documentation.

---

## Project Structure

```
src/
├── app.ts                    # Express app factory
├── index.ts                  # Server entry point
├── types/
│   └── index.ts              # Shared interfaces & enums
├── database/
│   └── data-source.ts        # TypeORM DataSource config
├── auth/
│   ├── auth.users.ts         # In-memory dummy users
│   ├── auth.service.ts       # Login & JWT logic
│   └── auth.router.ts        # POST /auth/login
├── tasks/
│   ├── task.entity.ts        # TypeORM entity
│   ├── task.dto.ts           # CreateTaskDto, UpdateTaskDto
│   ├── task.service.ts       # Business logic
│   └── task.router.ts        # Task CRUD routes
└── middleware/
    ├── auth.middleware.ts     # JWT verification
    └── error.middleware.ts    # Global error handler
tests/
├── auth.test.ts              # Login & auth middleware tests
├── tasks.test.ts             # Task endpoint integration tests
└── task.service.test.ts      # TaskService unit tests
```

---

## Design Decisions

1. **Express.js over NestJS** — Per the flexibility point in the test requirements, Express.js was chosen for its simplicity while still demonstrating TypeScript, validation, JWT auth, and TypeORM skills.

2. **TypeORM with `synchronize: true`** — Automatically creates/updates the database schema in development. In production, set `synchronize: false` and use proper migrations.

3. **Soft Deletes** — TypeORM's `@DeleteDateColumn()` + `softDelete()` handles this transparently. Soft-deleted records are automatically excluded from all queries.

4. **Repository pattern** — `TaskService` receives a `Repository<Task>` via constructor injection, making it fully testable without a real database.

5. **Consistent API responses** — All endpoints return `{ success, data?, error?, message? }` for predictable client handling.
