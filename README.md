# Smart Operations - Task Management System

A simple, role-based Task Management and Internal Operations System. This project is split into a frontend web app and a backend REST API.

## Project Structure

- **`/frontend`**: React single-page application built with Vite, TypeScript, and Tailwind CSS.
- **`/backend`**: Node.js + Express REST API built with TypeScript, Prisma, and PostgreSQL.

## Getting Started Quick Link

To get the entire application running, you will need to set up both the backend and frontend.

### 1. Prerequisites
- **Node.js** (v18+)
- **npm** or **yarn**
- **PostgreSQL** database running locally or hosted

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Adjust the `DATABASE_URL` and `JWT_SECRET` in `.env`
4. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Seed the database with default users:
   ```bash
   npm run db:seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Test Login Credentials
All default accounts share the password **`Password@123`**:
- **Admin**: `admin@ops.com`
- **Manager**: `manager@ops.com`
- **User**: `user@ops.com`

---

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Check/create `.env` and set `VITE_API_URL` to point to your local backend (usually `http://localhost:5000/api/v1`).
4. Start the development server:
   ```bash
   npm run dev
   ```

Now open your browser to the URL printed in the terminal (usually `http://localhost:5173`) to view the application!
