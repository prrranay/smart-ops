# Smart Operations - Backend API

This is the backend service for the Task Management System, built using Express, TypeScript, and Prisma ORM with PostgreSQL.

## Tech Stack
- **Runtime & Language**: Node.js & TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma Client
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in this directory (you can copy `.env.example` as a starting point) and configure the following variables:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_ops_db?schema=public"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"
```

### 3. Database Migration & Setup
Run the migrations to create the database schemas:
```bash
npm run prisma:migrate
```

Prisma client should automatically generate. If you need to manually regenerate it:
```bash
npm run prisma:generate
```

### 4. Database Seeding & Login Credentials
Seed the database with default test users:
```bash
npm run db:seed
```

The seeded accounts are created with the password **`Password@123`**:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@ops.com` | `Password@123` |
| **Manager** | `manager@ops.com` | `Password@123` |
| **User** | `user@ops.com` | `Password@123` |

### 5. Running the Server

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

Once running, the interactive API documentation (Swagger) is available at `http://localhost:5000/docs/`.
