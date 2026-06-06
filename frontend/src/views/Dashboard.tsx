import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/config/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import {
  CheckSquare,
  Clock,
  Play,
  ClipboardList,
  Eye,
  Activity,
  Bell,
  Check,
  Calendar
} from "lucide-react"

interface SummaryData {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  inProgressTasks: number
  reviewTasks: number
}

interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string
  createdAt: string
  user: {
    name: string
  }
}

interface Task {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null
  assignee?: {
    name: string
  } | null
}

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  if (user && user.role === "USER") {
    return <Navigate to="/tasks" replace />
  }

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery<SummaryData>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await api.get("/dashboard/summary")
      return res.data.data
    }
  })

  const {
    data: actsData,
    isLoading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery<{ activities: ActivityLog[] }>({
    queryKey: ["activities-feed"],
    queryFn: async () => {
      const res = await api.get("/activities", { params: { limit: 5 } })
      return res.data.data
    }
  })

  const {
    data: myTasksData,
    isLoading: myTasksLoading,
    error: myTasksError,
    refetch: refetchMyTasks
  } = useQuery<{ tasks: Task[] }>({
    queryKey: ["my-tasks-dashboard", user?.id],
    queryFn: async () => {
      const res = await api.get("/tasks", { params: { assignedTo: user?.id, limit: 5 } })
      return res.data.data
    },
    enabled: !!user?.id
  })

  const {
    data: notifs,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery<{ notifications: Notification[] }>({
    queryKey: ["notifications-feed"],
    queryFn: async () => {
      const res = await api.get("/notifications", { params: { limit: 5 } })
      return res.data.data
    }
  })

  const readAllMut = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] })
    }
  })

  const readMut = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] })
    }
  })

  const isLoading = summaryLoading || activitiesLoading || myTasksLoading || notificationsLoading
  const isError = summaryError || activitiesError || myTasksError || notificationsError

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <LoadingState message="Loading operations dashboard..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Dashboard Fetch Error"
          message="Failed to sync with smart internal operations backend services."
          onRetry={() => {
            refetchSummary()
            refetchActivities()
            refetchMyTasks()
            refetchNotifications()
          }}
        />
      </div>
    )
  }

  const fmtDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getPriorityColor = (p: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (p) {
      case "HIGH": return "destructive"
      case "MEDIUM": return "warning"
      default: return "secondary"
    }
  }

  const getStatusColor = (s: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (s) {
      case "DONE": return "success"
      case "REVIEW": return "default"
      case "IN_PROGRESS": return "secondary"
      default: return "outline"
    }
  }

  const stats = [
    {
      title: "Total Tasks",
      value: summary?.totalTasks ?? 0,
      description: "Active system tasks",
      icon: ClipboardList,
      color: "text-zinc-500"
    },
    {
      title: "Pending",
      value: summary?.pendingTasks ?? 0,
      description: "Awaiting operator trigger",
      icon: Clock,
      color: "text-amber-500"
    },
      {
        title: "In Progress",
        value: summary?.inProgressTasks ?? 0,
        description: "Currently actively run",
        icon: Play,
        color: "text-blue-500"
      },
    {
      title: "Reviewing",
      value: summary?.reviewTasks ?? 0,
      description: "Requires administrator check",
      icon: Eye,
      color: "text-purple-500"
    },
    {
      title: "Completed",
      value: summary?.completedTasks ?? 0,
      description: "Closed successfully",
      icon: CheckSquare,
      color: "text-emerald-500"
    }
  ]

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Operator Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real-time metrics, workload summary, and personal operations feed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">My Assigned Tasks</CardTitle>
                <CardDescription className="text-xs">Your active operational duties.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {myTasksData?.tasks && myTasksData.tasks.length > 0 ? (
                myTasksData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-1 border-b border-zinc-150 dark:border-zinc-850 pb-2 last:border-0 last:pb-0 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                        {task.title}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant={getPriorityColor(task.priority)} className="text-[9px] px-1 py-0 scale-95 origin-right">
                          {task.priority}
                        </Badge>
                        <Badge variant={getStatusColor(task.status)} className="text-[9px] px-1 py-0 scale-95 origin-right">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Check className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">All caught up!</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">No tasks assigned to you.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Recent System Activity</CardTitle>
                <CardDescription className="text-xs">Audit log across operator actions.</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actsData?.activities && actsData.activities.length > 0 ? (
                actsData.activities.map((log) => {
                  const displayAction = log.action
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/^\w/, (c) => c.toUpperCase())

                  return (
                    <div
                      key={log.id}
                      className="flex items-start justify-between border-b border-zinc-150 dark:border-zinc-850 pb-2.5 last:border-0 last:pb-0 text-left"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">{displayAction}</p>
                        <p className="text-[10px] text-muted-foreground">
                          By {log.user?.name || "System"} • {fmtDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Quiet timeline</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">No activity logs recorded yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Alerts & Notifications</CardTitle>
                <CardDescription className="text-xs">Operational warnings and status logs.</CardDescription>
              </div>
              {notifs?.notifications && notifs.notifications.some(n => !n.isRead) && (
                <button
                  onClick={() => readAllMut.mutate()}
                  disabled={readAllMut.isPending}
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {notifs?.notifications && notifs.notifications.length > 0 ? (
                notifs.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start justify-between gap-3 p-2 rounded-lg border text-left transition-colors ${
                      notif.isRead
                        ? "bg-transparent border-zinc-150 dark:border-zinc-850"
                        : "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/20"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => readMut.mutate(notif.id)}
                        className="text-zinc-400 hover:text-foreground shrink-0 mt-0.5"
                        title="Mark read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">All alerts clear</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">No new notifications found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
