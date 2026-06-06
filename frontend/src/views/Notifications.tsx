import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/config/axios"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { formatRelativeTime } from "@/lib/relative-time"
import { Bell, Check, Eye, ShieldAlert, CheckCircle2, MessageSquare, Flame } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useNavigate } from "react-router-dom"

interface NotificationItem {
  id: string
  type: "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "TASK_COMMENT_ADDED" | "TASK_DUE_SOON" | "WORKLOAD_HIGH"
  title: string
  message: string
  isRead: boolean
  metadata?: { taskId?: string } | null
  createdAt: string
}

export default function Notifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filterRead, setFilterRead] = useState<"all" | "unread">("unread")

  // Query notifications list
  const {
    data: feedData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["notifications-feed", page, filterRead],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit: 10
      }
      if (filterRead === "unread") {
        params.isRead = false
      }
      const res = await api.get("/notifications", { params })
      return res.data.data
    },
    enabled: !!user
  })

  const notifications = (feedData?.notifications || []) as NotificationItem[]
  const totalPages = feedData?.totalPages ?? 1
  const totalCount = feedData?.totalCount ?? 0

  // Mutation: Mark single as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-dropdown-list"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] })
      toast("Notification marked as read.", "success")
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update notification.", "error")
    }
  })

  // Mutation: Mark all read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-dropdown-list"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] })
      toast("All notifications marked as read.", "success")
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update notifications.", "error")
    }
  })

  // Get matching type icon helper
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "TASK_STATUS_CHANGED":
        return <Eye className="h-4 w-4 text-indigo-500" />
      case "TASK_COMMENT_ADDED":
        return <MessageSquare className="h-4 w-4 text-amber-500" />
      case "TASK_DUE_SOON":
        return <Flame className="h-4 w-4 text-rose-500" />
      case "WORKLOAD_HIGH":
        return <ShieldAlert className="h-4 w-4 text-orange-500 animate-pulse" />
      default:
        return <Bell className="h-4 w-4 text-zinc-500" />
    }
  }

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id)
    }
    if (notif.metadata?.taskId) {
      navigate(`/tasks?search=${notif.title}`)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto page-enter">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your unread system alerts, task updates, and workload warnings.
          </p>
        </div>

        {filterRead === "unread" && totalCount > 0 && (
          <Button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            variant="outline"
            size="sm"
            className="gap-1.5 self-start sm:self-auto font-medium"
          >
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Tabs / Filters Panel */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-850 pb-px">
        <button
          onClick={() => {
            setFilterRead("unread")
            setPage(1)
          }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            filterRead === "unread"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread ({filterRead === "unread" ? totalCount : "..."})
        </button>
        <button
          onClick={() => {
            setFilterRead("all")
            setPage(1)
          }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            filterRead === "all"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Notifications
        </button>
      </div>

      {/* List Layout */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="animate-pulse border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-4 flex gap-4">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-80 bg-zinc-150 dark:bg-zinc-850 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Connection Failure"
          message="Could not retrieve notifications feed."
          onRetry={refetch}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description={
            filterRead === "unread"
              ? "No unread alerts. Check your history for past updates."
              : "No notification history was found for your operator account."
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                !notif.isRead
                  ? "bg-primary/[0.03] dark:bg-primary/[0.02] border-primary/20 hover:border-primary/30"
                  : "bg-card border-zinc-150 dark:border-zinc-850/80 hover:border-zinc-300 dark:hover:border-zinc-700/60"
              }`}
            >
              {/* Type Icon */}
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shrink-0 mt-0.5">
                {getNotificationIcon(notif.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-4">
                  <p className={`text-xs font-semibold leading-normal ${!notif.isRead ? "text-foreground" : "text-zinc-650 dark:text-zinc-350"}`}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal pr-4">
                  {notif.message}
                </p>
              </div>

              {/* Click action indicator */}
              {!notif.isRead && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
              )}
            </div>
          ))}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 text-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
