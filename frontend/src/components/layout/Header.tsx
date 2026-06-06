import { useLocation, Link, useNavigate } from "react-router-dom"
import { Bell, Sun, Moon, Menu, ChevronRight, Check, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Avatar } from "@/components/ui/avatar"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/config/axios"
import { formatRelativeTime } from "@/lib/relative-time"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  interface NotificationItem {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    metadata?: { taskId?: string } | null
    createdAt: string
  }

  // Query unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const res = await api.get("/notifications", { params: { isRead: false, limit: 1 } })
      return res.data.data
    },
    refetchInterval: 60000,
    enabled: !!user
  })

  const unreadCount = unreadData?.totalCount ?? 0

  // Query last 5 notifications for dropdown
  const { data: dropdownNotifsData, isLoading: notifsLoading } = useQuery({
    queryKey: ["notifications-dropdown-list"],
    queryFn: async () => {
      const res = await api.get("/notifications", { params: { limit: 5 } })
      return res.data.data
    },
    enabled: !!user && notifDropdownOpen
  })

  const dropdownNotifications = (dropdownNotifsData?.notifications || []) as NotificationItem[]

  // Mutation to mark single read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-dropdown-list"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] })
    }
  })

  // Mutation to mark all read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-dropdown-list"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] })
    }
  })

  // Sync theme to root class
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // Generate breadcrumbs from current path
  const pathSegments = location.pathname.split("/").filter(Boolean)
  
  return (
    <header className="sticky top-0 h-16 border-b glass-panel flex items-center justify-between px-6 z-10 transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">SmartOps</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          {pathSegments.length === 0 ? (
            <span className="text-foreground font-semibold">Dashboard</span>
          ) : (
            pathSegments.map((segment, index) => {
              const isLast = index === pathSegments.length - 1
              const title = segment.charAt(0).toUpperCase() + segment.slice(1)
              return (
                <div key={segment} className="flex items-center gap-1.5">
                  <span className={isLast ? "text-foreground font-semibold" : "hover:text-foreground cursor-pointer transition-colors"}>
                    {title}
                  </span>
                  {!isLast && <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">


        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen)
              setDropdownOpen(false) // Close profile dropdown
            }}
            className="text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </Button>

          {notifDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotifDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card p-1 shadow-lg z-20 animate-fade-in text-left">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-150 dark:border-zinc-850">
                  <span className="text-xs font-semibold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                      className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {markAllReadMutation.isPending ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <Check className="h-2.5 w-2.5" />
                      )}
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                  {notifsLoading ? (
                    <div className="py-6 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : dropdownNotifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p className="text-xs font-medium">All caught up!</p>
                      <p className="text-[10px] text-zinc-400">No recent notifications.</p>
                    </div>
                  ) : (
                    dropdownNotifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead) {
                            markReadMutation.mutate(notif.id)
                          }
                          setNotifDropdownOpen(false)
                          if (notif.metadata?.taskId) {
                            navigate(`/tasks?search=${notif.title}`)
                          }
                        }}
                        className={`w-full text-left p-2.5 rounded-md text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex gap-2 relative ${
                          !notif.isRead ? "bg-primary/5 dark:bg-primary/5" : ""
                        }`}
                      >
                        {/* Unread indicator dot */}
                        {!notif.isRead && (
                          <span className="absolute right-2 top-3.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-semibold">
                          <Info className="h-3 w-3" />
                        </div>
                        <div className="space-y-0.5 pr-3">
                          <p className="font-semibold text-foreground leading-snug">{notif.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">{notif.message}</p>
                          <span className="text-[9px] text-zinc-400 block pt-0.5">{formatRelativeTime(notif.createdAt)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-zinc-150 dark:border-zinc-850 p-1">
                  <Link
                    to="/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="block text-center rounded-md py-1.5 text-[10px] font-semibold text-zinc-550 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:text-foreground transition-colors"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <Avatar fallback={user?.name || "Operator"} className="h-8 w-8 text-xs cursor-pointer" />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay to close on click outside */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card p-1 shadow-lg z-20 animate-fade-in">
                <div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-left">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  <span className="inline-flex mt-1 items-center rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    logout()
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs text-rose-500 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 transition-colors"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
