import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { Avatar } from "@/components/ui/avatar"

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  className?: string
}

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER"] },
  { name: "Tasks", path: "/tasks", icon: ListTodo, roles: ["ADMIN", "MANAGER", "USER"] },
  { name: "Team", path: "/team", icon: Users, roles: ["ADMIN", "MANAGER"] },
  { name: "Activities", path: "/activities", icon: Activity, roles: ["ADMIN", "MANAGER", "USER"] },
]

export function Sidebar({ collapsed, setCollapsed, className }: SidebarProps) {
  const { user } = useAuth()
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r transition-all duration-300 ease-in-out bg-zinc-950 text-zinc-100 border-zinc-800 z-20 overflow-x-hidden",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-violet-500 shadow-md shadow-primary/30 flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent transition-all duration-300 whitespace-nowrap">
              SmartOps
            </span>
          )}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems
          .filter((item) => item.roles.includes(user?.role || "USER"))
          .map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105", isActive ? "text-white" : "text-zinc-400 group-hover:text-white")} />
                {!collapsed && (
                  <span className="transition-all duration-300 whitespace-nowrap">
                    {item.name}
                  </span>
                )}
                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="absolute left-full ml-6 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                    {item.name}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile Peek & Toggle Footer */}
      <div className={cn("border-t border-zinc-800 space-y-4", collapsed ? "p-3" : "p-4")}>
        {/* User Card */}
        <div className={cn("flex items-center overflow-hidden", collapsed ? "justify-center py-1.5" : "gap-3 px-2 py-1.5")}>
          <Avatar fallback={user?.name || "Operator"} className="h-9 w-9 text-xs border border-zinc-800 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-zinc-500 truncate">{user?.email}</span>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <div className={cn("flex", collapsed ? "justify-center" : "justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
