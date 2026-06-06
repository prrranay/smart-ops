import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { LoadingState } from "@/components/ui/loading-state"

export function PublicRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <LoadingState message="Restoring session..." />
      </div>
    )
  }

  if (user) {
    // Check if there was a redirected path, otherwise default to dashboard
    const from = (location.state as any)?.from?.pathname || "/"
    return <Navigate to={from} replace />
  }

  return <Outlet />
}

export default PublicRoute
