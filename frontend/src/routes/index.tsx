import { createBrowserRouter } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import Dashboard from "@/views/Dashboard"
import Tasks from "@/views/Tasks"
import Team from "@/views/Team"
import Notifications from "@/views/Notifications"
import Activities from "@/views/Activities"
import Login from "@/views/Login"
import ProtectedRoute from "@/routes/ProtectedRoute"
import PublicRoute from "@/routes/PublicRoute"

export const router = createBrowserRouter([
  // Publicly accessible Auth routes
  {
    element: <PublicRoute />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
    ],
  },
  // Protected Admin/Operator routes
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "",
            element: <Dashboard />,
          },
          {
            path: "tasks",
            element: <Tasks />,
          },
          {
            path: "team",
            element: <Team />,
          },
          {
            path: "notifications",
            element: <Notifications />,
          },
          {
            path: "activities",
            element: <Activities />,
          },
        ],
      },
    ],
  },
])

export default router
