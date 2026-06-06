# Smart Operations - Frontend App

This is the frontend dashboard for the Task Management System, built with React, Vite, TypeScript, and Tailwind CSS.

## Tech Stack
- **Framework**: React (Vite template)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios & React Query

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the frontend folder:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Run the Development Server
```bash
npm run dev
```

The app will start running locally at `http://localhost:5173`.

### 4. Test Login Credentials
To sign in, you can use any of the seeded users (shared password **`Password@123`**):
- **Admin**: `admin@ops.com`
- **Manager**: `manager@ops.com`
- **User**: `user@ops.com`

### 5. Build for Production
To bundle the frontend assets for deployment:
```bash
npm run build
```
The output files will be in the `/dist` directory.
