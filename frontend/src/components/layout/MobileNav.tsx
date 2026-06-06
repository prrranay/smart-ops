import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  ListTodo,
  ShieldCheck,
  X,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { Avatar } from "@/components/ui/avatar"

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER"] },
  { name: "Tasks", path: "/tasks", icon: ListTodo, roles: ["ADMIN", "MANAGER", "USER"] },
  { name: "Team", path: "/team", icon: Users, roles: ["ADMIN", "MANAGER"] },
  { name: "Activities", path: "/activities", icon: Activity, roles: ["ADMIN", "MANAGER", "USER"] },
]

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative flex flex-col w-72 max-w-xs h-full bg-zinc-950 text-zinc-100 border-r border-zinc-800 p-6 shadow-2xl animate-slide-in-right z-10">
        {/* Header with Close */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-violet-500">
              <ShieldCheck className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              SmartOps
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900"
            onClick={onClose}
          >
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5">
          {navItems
            .filter((item) => item.roles.includes(user?.role || "USER"))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-zinc-400")} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
        </nav>

        {/* Footer */}
        <div className="pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2">
            <Avatar fallback={user?.name || "Operator"} className="h-9 w-9 text-xs border border-zinc-800 shrink-0" />
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{user?.name}</span>
              <span className="text-xs text-zinc-500 truncate">{user?.email}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
