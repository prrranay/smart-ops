import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/config/axios"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { formatRelativeTime } from "@/lib/relative-time"
import { Activity, ClipboardList, MessageSquare, PlusCircle, CheckSquare, RefreshCw, UserCheck } from "lucide-react"

interface ActivityLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  metadata: any
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
  } | null
}

export default function Activities() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>("all")

  // Query activities list
  const {
    data: activitiesData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["activities-feed", page, actionFilter],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit: 15
      }
      if (actionFilter !== "all") {
        params.action = actionFilter
      }
      const res = await api.get("/activities", { params })
      return res.data.data
    },
    enabled: !!user
  })

  const activities = (activitiesData?.activities || []) as ActivityLog[]
  const totalPages = activitiesData?.totalPages ?? 1
  const totalCount = activitiesData?.totalCount ?? 0

  const formatActivityAction = (act: string) => {
    return act
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  }

  // Get matching icon for action type
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "TASK_CREATED":
        return <PlusCircle className="h-4 w-4 text-emerald-500" />
      case "TASK_ASSIGNED":
        return <UserCheck className="h-4 w-4 text-indigo-500" />
      case "TASK_STATUS_CHANGED":
        return <CheckSquare className="h-4 w-4 text-blue-500" />
      case "COMMENT_ADDED":
        return <MessageSquare className="h-4 w-4 text-amber-500" />
      default:
        return <ClipboardList className="h-4 w-4 text-zinc-500" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto page-enter">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log & Activities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.role === "USER"
              ? "Monitor your latest personal actions and system contributions."
              : "Track recent operational updates and activities across the system."}
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="gap-1.5 self-start sm:self-auto font-medium"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Logs
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-850 pb-px overflow-x-auto">
        {[
          { key: "all", label: "All Activities" },
          { key: "TASK_CREATED", label: "Task Creations" },
          { key: "TASK_ASSIGNED", label: "Assignments" },
          { key: "TASK_STATUS_CHANGED", label: "Status Changes" },
          { key: "COMMENT_ADDED", label: "Comments" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActionFilter(tab.key)
              setPage(1)
            }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
              actionFilter === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Layout */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
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
          message="Could not retrieve activities feed."
          onRetry={refetch}
        />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Quiet timeline"
          description={
            actionFilter === "all"
              ? "No activity logs recorded yet."
              : "No activities found matching this filter."
          }
        />
      ) : (
        <div className="space-y-2">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-4 rounded-xl border bg-card border-zinc-150 dark:border-zinc-850/80 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all text-left"
            >
              {/* Type Icon */}
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shrink-0 mt-0.5">
                {getActivityIcon(act.action)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold leading-normal text-foreground">
                    {formatActivityAction(act.action)}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground leading-normal space-y-1">
                  <p>
                    Performed by <span className="font-semibold text-zinc-700 dark:text-zinc-300">{act.user?.name || "System"}</span> ({act.user?.email || "system@smartops.com"})
                  </p>
                  {act.metadata && Object.keys(act.metadata).length > 0 && (
                    <div className="mt-1 text-[10px] bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded border border-zinc-100 dark:border-zinc-900/80 font-mono text-zinc-650 dark:text-zinc-350">
                      {act.metadata.taskTitle && (
                        <div>Task: {act.metadata.taskTitle}</div>
                      )}
                      {act.metadata.status && (
                        <div>Status: {act.metadata.status}</div>
                      )}
                      {act.metadata.assigneeName && (
                        <div>Assignee: {act.metadata.assigneeName}</div>
                      )}
                      {act.metadata.commentContent && (
                        <div className="truncate">Comment: "{act.metadata.commentContent}"</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                Page {page} of {totalPages} (Total logs: {totalCount})
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
