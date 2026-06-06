# Smart Internal Operations System - Backend

Welcome to the backend foundation for the production-ready **Smart Internal Operations System**. Built using **Node.js, Express, TypeScript, and PostgreSQL**, with **Prisma ORM** as the database query engine, this system implements a clean **Modular Monolith** architecture with strict service-repository separation.

---

## 🏗️ Architecture Overview

The codebase is organized as a **Modular Monolith**. Domains are partitioned into self-contained logical folders. Cross-module communications are governed through clear service boundaries, keeping modules decoupled and easing eventual microservice extraction.

```
src/
├── config/              # Centralized configuration (db, env, swagger)
├── middleware/          # Global and route-specific Express middlewares
├── repositories/        # Shared database query repository layer
├── types/               # TypeScript declarations and shared interfaces/enums
├── utils/               # App utilities (structured logging, custom AppErrors)
└── modules/             # Domain-specific modules
    ├── auth/            # Authentication & session profile domain
    ├── tasks/           # Core task creation, filters, and status modifications
    ├── comments/        # Task collaborations and comment history
    ├── activities/      # Extensible activity log audit trails
    └── dashboard/       # Administrative workloads and summary metrics
```

### 1. Architectural Layers
1. **Controller Layer**: Handles Express HTTP request/response lifecycles, runs request validation middleware, and forwards inputs to the service layer.
2. **Service Layer**: House of business logic, rule evaluations, and automatic triggers (e.g. logging activity when a task status changes).
3. **Repository Layer**: Centralized database interactions using Prisma Client. Keeps raw query engines abstracted away from domain services.

---

## 🚀 Setup Instructions

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **PostgreSQL** database instance running locally or via Docker
- **npm** or **yarn** package manager

### 2. Installation
Clone the repository and install dependencies in the backend root directory:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Ensure your database connection string and secret key are configured:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5433/smart_ops_db?schema=public"
JWT_SECRET="super-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
```

### 5. Running the Application
- **Development Mode** (with hot reloading via `tsx`):
  ```bash
  npm run dev
  ```
- **Production Compilation**:
  ```bash
  npm run build
  npm start
  ```
- **Swagger Documentation API Portal**:
  Access the interactive API explorer at `http://localhost:5000/docs/`.

---

## 🔑 Environment Variables

The application validates configuration variables at startup using a strict **Zod Schema**. Missing or misconfigured values will immediately crash the process to prevent silent failures.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `Number` | `5000` | The port the HTTP server binds to. |
| `NODE_ENV` | `Enum` | `development` | Environment mode (`development`, `production`, `test`). |
| `DATABASE_URL` | `String` | Required | PostgreSQL connection string containing credentials and port. |
| `JWT_SECRET` | `String` | Required | Symmetric key used to sign and verify JWT tokens. |
| `JWT_EXPIRES_IN` | `String` | `24h` | Validity duration of signed user access tokens. |

---

## 🗄️ Database Schema

The database model is defined in `prisma/schema.prisma`. Relationships are enforced using foreign keys and cascading delete constraints.

```mermaid
erDiagram
    users {
        string id PK
        string email UK
        string password
        string name
        enum role "ADMIN | MANAGER | USER"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    tasks {
        string id PK
        string title
        string description
        enum status "TODO | IN_PROGRESS | REVIEW | DONE"
        enum priority "LOW | MEDIUM | HIGH"
        datetime dueDate
        string createdBy FK
        string assignedTo FK
        datetime createdAt
        datetime updatedAt
    }
    comments {
        string id PK
        string taskId FK
        string userId FK
        string content
        datetime createdAt
    }
    activity_logs {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        json metadata
        datetime createdAt
    }
    notifications {
        string id PK
        string userId FK
        enum type "TASK_ASSIGNED | TASK_STATUS_CHANGED | TASK_COMMENT_ADDED | TASK_DUE_SOON | WORKLOAD_HIGH"
        string title
        string message
        boolean isRead
        json metadata
        datetime createdAt
    }

    users ||--o{ tasks : "creates (CreatedTasks)"
    users ||--o{ tasks : "assigned (AssignedTasks)"
    users ||--o{ comments : "posts"
    users ||--o{ activity_logs : "performs"
    users ||--o{ notifications : "receives"
    tasks ||--o{ comments : "has"
```

### Model Detail Descriptions
1. **User**: Represents team members. Roles dictate system-wide capabilities:
   - `ADMIN`: Unrestricted capabilities.
   - `MANAGER`: Administrative capabilities.
   - `USER`: Regular employee. Can view assigned tasks and modify status.
2. **Task**: Core unit of work. Statuses and Priorities map directly to database-level enums (`TaskStatus` and `TaskPriority`).
3. **Comment**: Task collaborative notes. Has cascading deletes bound to both Task and User.
4. **ActivityLog**: Non-destructive audit trail records tracking events (`TASK_CREATED`, `TASK_UPDATED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `COMMENT_ADDED`).
5. **Notification**: User inbox alert records, covering assignments, status changes, comment mentions, and manager workload warnings.

---

## 📡 API Documentation Summary

A comprehensive Swagger OpenApi specification is mounted on `/docs/`. All successful API responses follow a unified envelop format:
```json
{
  "status": "success",
  "data": { ... }
}
```

### 1. Authentication (`/api/v1/auth`)
- **POST `/signup`**: Register a new user profile.
- **POST `/login`**: Authenticate credentials and return a bearer access token.
- **GET `/me`**: Fetch details of the current logged-in session.

### 2. Task Management (`/api/v1/tasks`)
- **POST `/`**: Create a new task. Restricted to `ADMIN` and `MANAGER`.
- **GET `/`**: Paginated listing of tasks with filters (`status`, `priority`, `assignedTo`).
  - *Constraint*: Regular `USER` accounts only retrieve tasks assigned to them.
- **GET `/:id`**: Fetch a single task by ID.
  - *Constraint*: Users can only view tasks assigned to them.
- **PATCH `/:id`**: Modify task details. Restricted to `ADMIN` and `MANAGER`.
- **POST `/:id/assign`**: Assign or unassign task to user. Restricted to `ADMIN` and `MANAGER`.
- **PATCH `/:id/status`**: Modify task status.
  - *Constraint*: Users can only modify status of tasks assigned to them.

### 3. Comments Collaboration (`/api/v1/tasks/:taskId/comments`)
- **POST `/`**: Post comment.
- **GET `/`**: Paginated, reverse-chronological list of comments for a task.

### 4. Activity Logs (`/api/v1/activities`)
- **GET `/`**: Paginated activity audit logs timeline.
  - *Constraint*: Regular `USER` only retrieves logs of events they performed. `ADMIN` and `MANAGER` can query all events and filter by any `userId`.

### 5. Dashboard (`/api/v1/dashboard`)
- **GET `/summary`**: Retrieve count breakdowns of tasks by status. Restricted to `ADMIN` and `MANAGER`.
- **GET `/workload`**: Retrieve workload points scoring lists for all active employees. Restricted to `ADMIN` and `MANAGER`.

### 6. Notifications (`/api/v1/notifications`)
- **GET `/`**: Retrieve paginated notification records for the authenticated user. Supports filtering by read status (`isRead`).
- **PATCH `/:id/read`**: Mark a single notification as read (validates ownership).
- **PATCH `/read-all`**: Mark all notifications for the authenticated user as read.

---

## 💡 Key Design Decisions

### 1. Centralized Repositories vs Domain Folders
Repositories reside in `src/repositories/` rather than in individual domain modules. This design choice prevents **circular dependencies** during cross-module lookups. For example:
- `CommentService` must query `TaskRepository` to verify task existence.
- `TaskService` must verify user existence via `UserRepository`.
- Placing repositories in a shared folder with unidirectional imports from modules ensures compile-time safety.

### 2. Service-Centered Automatic Audit Logs
Automatic logging (`TASK_CREATED`, `TASK_UPDATED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `COMMENT_ADDED`) is implemented within the service boundaries. Rather than using database triggers or middleware hooks:
- Placing logging inside the service guarantees that audit logs are created in the **same transaction context** as the database write.
- Allows capturing rich state context (like storing the "previous" task properties in `metadata` on updates) which is difficult to extract cleanly in Express routing middleware.

### 3. Single-Query Dashboard Aggregation
To keep dashboard loading speeds high, the `/dashboard/summary` endpoint utilizes Prisma's optimized `groupBy` query. This replaces multiple independent database roundtrips with a single database call, improving throughput.

---

## ⚖️ Tradeoffs

### 1. In-Memory Workload Calculations vs Database Views
- **Tradeoff**: Workload indicator calculations are computed in Node.js application memory rather than using database-defined SQL Views.
- **Why**: Computing scores (`HIGH = 3`, `MEDIUM = 2`, `LOW = 1`) in application memory keeps the scoring logic easily **unit-testable**, customizable in TypeScript code, and decoupled from raw SQL.
- **Mitigation**: To prevent scaling bottlenecks, the `findMany` query uses strict Prisma `select` scopes, fetching only the priority string column to keep payload transfers negligible.

### 2. Soft Deletes vs Cascade Hard Deletes
- **Tradeoff**: Comments and activity logs use database-level cascades (`onDelete: Cascade`) for record removals, while task creators prevent deletion (`onDelete: Restrict`).
- **Why**: Ensures integrity. Tasks must never be orphaned or deleted without managerial intervention, whereas comments can be cleanly cascaded.

---

## 📈 Scaling Strategy

As operations scale from hundreds of tasks to millions, the system is designed to grow through these strategies:

### 1. Database Scaling
- **Read/Write Splitting**: Prisma natively supports read replicas. We can route dashboard queries and logging timelines to read replicas while keeping transactional task writes on the primary master database node.
- **Partial Indexes**: Add database indexes on frequently filtered columns in `tasks`:
  ```sql
  CREATE INDEX idx_tasks_assigned_status ON tasks("assignedTo", "status");
  ```
- **Partitioning**: As activity logs grow large, we can partition the `activity_logs` table by month/quarter to keep query searches fast.

### 2. Caching Layer
- **Redis Integration**: Integrate a Redis cache for:
  - Dashboard summaries (`/dashboard/summary`), invalidated when tasks are created or status updates are processed.
  - Active workloads lists (`/dashboard/workload`), cached with a short TTL (e.g. 5 minutes).

### 3. Asynchronous Task Queue (BullMQ)
- **Offload Audit Trail Log Ingestion**: Instead of performing activity logging synchronously inside API request contexts, publish events to a Redis-backed BullMQ queue. A pool of background workers will ingest these events and write logs asynchronously.
