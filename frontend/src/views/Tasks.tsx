import { useState } from "react"
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { api } from "@/config/axios"
import { useAuth } from "@/hooks/useAuth"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { TaskFormModal } from "@/components/tasks/TaskFormModal"
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal"
import { useToast } from "@/hooks/useToast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { cn } from "@/lib/utils"
import {
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit2,
  Kanban,
  LayoutList,
  Loader2
} from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null
  createdBy: string
  assignedTo: string | null
  creator: {
    name: string
  }
  assignee?: {
    id: string
    name: string
  } | null
}

interface UserWorkload {
  userId: string
  userName: string
}

export default function Tasks() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [priority, setPriority] = useState<string>("all")
  const [assignee, setAssignee] = useState<string>("all")
  const [page, setPage] = useState<number>(1)

  const [view, setView] = useState<"board" | "table">("board")

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER"
  const queryClient = useQueryClient()

  const { data: usersData } = useQuery<UserWorkload[]>({
    queryKey: ["active-users-workload"],
    queryFn: async () => {
      const res = await api.get("/dashboard/workload")
      return res.data.data
    },
    enabled: canManage
  })

  const [colLimits, setColLimits] = useState<Record<"TODO" | "IN_PROGRESS" | "REVIEW" | "DONE", number>>({
    TODO: 10,
    IN_PROGRESS: 10,
    REVIEW: 10,
    DONE: 10
  })

  const limit = 10

  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks
  } = useQuery<{
    tasks: Task[]
    totalPages: number
    totalCount: number
  }>({
    queryKey: [
      "tasks-list",
      status,
      priority,
      assignee,
      page,
      user?.id
    ],
    queryFn: async () => {
      const params: any = {
        page: page,
        limit: limit
      }
      if (status !== "all") params.status = status
      if (priority !== "all") params.priority = priority
      
      if (canManage) {
        if (assignee !== "all") params.assignedTo = assignee
      } else {
        params.assignedTo = user?.id
      }

      const res = await api.get("/tasks", { params })
      return res.data.data
    },
    enabled: view === "table" && !!user,
    placeholderData: keepPreviousData
  })

  const { data: todoData, isLoading: todoLoading, error: todoError, isFetching: todoFetching } = useQuery<{
    tasks: Task[]
    totalPages: number
    totalCount: number
  }>({
    queryKey: ["tasks-column", "TODO", priority, assignee, colLimits.TODO, user?.id],
    queryFn: async () => {
      const params: any = {
        page: 1,
        limit: colLimits.TODO,
        status: "TODO"
      }
      if (priority !== "all") params.priority = priority
      if (canManage) {
        if (assignee !== "all") params.assignedTo = assignee
      } else {
        params.assignedTo = user?.id
      }
      const res = await api.get("/tasks", { params })
      return res.data.data
    },
    enabled: view === "board" && !!user,
    placeholderData: keepPreviousData
  })

  const { data: inProgressData, isLoading: inProgressLoading, error: inProgressError, isFetching: inProgressFetching } = useQuery<{
    tasks: Task[]
    totalPages: number
    totalCount: number
  }>({
    queryKey: ["tasks-column", "IN_PROGRESS", priority, assignee, colLimits.IN_PROGRESS, user?.id],
    queryFn: async () => {
      const params: any = {
        page: 1,
        limit: colLimits.IN_PROGRESS,
        status: "IN_PROGRESS"
      }
      if (priority !== "all") params.priority = priority
      if (canManage) {
        if (assignee !== "all") params.assignedTo = assignee
      } else {
        params.assignedTo = user?.id
      }
      const res = await api.get("/tasks", { params })
      return res.data.data
    },
    enabled: view === "board" && !!user,
    placeholderData: keepPreviousData
  })

  const { data: reviewData, isLoading: reviewLoading, error: reviewError, isFetching: reviewFetching } = useQuery<{
    tasks: Task[]
    totalPages: number
    totalCount: number
  }>({
    queryKey: ["tasks-column", "REVIEW", priority, assignee, colLimits.REVIEW, user?.id],
    queryFn: async () => {
      const params: any = {
        page: 1,
        limit: colLimits.REVIEW,
        status: "REVIEW"
      }
      if (priority !== "all") params.priority = priority
      if (canManage) {
        if (assignee !== "all") params.assignedTo = assignee
      } else {
        params.assignedTo = user?.id
      }
      const res = await api.get("/tasks", { params })
      return res.data.data
    },
    enabled: view === "board" && !!user,
    placeholderData: keepPreviousData
  })

  const { data: doneData, isLoading: doneLoading, error: doneError, isFetching: doneFetching } = useQuery<{
    tasks: Task[]
    totalPages: number
    totalCount: number
  }>({
    queryKey: ["tasks-column", "DONE", priority, assignee, colLimits.DONE, user?.id],
    queryFn: async () => {
      const params: any = {
        page: 1,
        limit: colLimits.DONE,
        status: "DONE"
      }
      if (priority !== "all") params.priority = priority
      if (canManage) {
        if (assignee !== "all") params.assignedTo = assignee
      } else {
        params.assignedTo = user?.id
      }
      const res = await api.get("/tasks", { params })
      return res.data.data
    },
    enabled: view === "board" && !!user,
    placeholderData: keepPreviousData
  })

  const boardLoading = view === "board" && (todoLoading || inProgressLoading || reviewLoading || doneLoading)
  const isCurrentlyLoading = view === "table" ? tasksLoading : boardLoading

  const boardError = view === "board" && (!!todoError || !!inProgressError || !!reviewError || !!doneError)
  const tasksErrorCombined = view === "table" ? tasksError : boardError

  const refetchCombined = () => {
    if (view === "table") {
      refetchTasks()
    } else {
      queryClient.invalidateQueries({ queryKey: ["tasks-column"] })
    }
  }

  const totalBoardTasksCount = (todoData?.tasks?.length || 0) +
                               (inProgressData?.tasks?.length || 0) +
                               (reviewData?.tasks?.length || 0) +
                               (doneData?.tasks?.length || 0)

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      setUpdatingTaskId(taskId)
      await api.patch(`/tasks/${taskId}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] })
      queryClient.invalidateQueries({ queryKey: ["tasks-column"] })
      toast("Task status updated successfully.", "success")
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update task status.", "error")
    },
    onSettled: () => {
      setUpdatingTaskId(null)
    }
  })

  const getAllTasks = () => {
    if (view === "table") {
      return tasksData?.tasks || []
    } else {
      return [
        ...(todoData?.tasks || []),
        ...(inProgressData?.tasks || []),
        ...(reviewData?.tasks || []),
        ...(doneData?.tasks || [])
      ]
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const all = getAllTasks()
    const taskObj = all.find((t) => t.id === taskId)
    const isAssignee = taskObj?.assignedTo === user?.id
    if (!canManage && !isAssignee) {
      e.preventDefault()
      toast("You are not authorized to move this task.", "error")
      return
    }
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = "move"
    e.currentTarget.classList.add("opacity-50")
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null)
    setDragOverStatus(null)
    e.currentTarget.classList.remove("opacity-50")
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    if (dragOverStatus !== status) {
      setDragOverStatus(status)
    }
  }

  const handleDrop = (e: React.DragEvent, status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE") => {
    e.preventDefault()
    setDragOverStatus(null)
    if (!draggedTaskId) return

    const all = getAllTasks()
    const taskObj = all.find((t) => t.id === draggedTaskId)
    if (taskObj && taskObj.status !== status) {
      updateStatusMutation.mutate({ taskId: draggedTaskId, status })
    }
    setDraggedTaskId(null)
  }

  const getColumnHasMore = (status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE") => {
    let count = 0
    let currentCount = 0
    if (status === "TODO") {
      count = todoData?.totalCount || 0
      currentCount = todoData?.tasks?.length || 0
    } else if (status === "IN_PROGRESS") {
      count = inProgressData?.totalCount || 0
      currentCount = inProgressData?.tasks?.length || 0
    } else if (status === "REVIEW") {
      count = reviewData?.totalCount || 0
      currentCount = reviewData?.tasks?.length || 0
    } else if (status === "DONE") {
      count = doneData?.totalCount || 0
      currentCount = doneData?.tasks?.length || 0
    }
    return currentCount < count
  }

  const handleLoadMore = (status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE") => {
    setColLimits((prev) => ({
      ...prev,
      [status]: prev[status] + 10
    }))
  }

  const filteredTasks = tasksData?.tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  ) || []

  const getPriorityBadgeColor = (p: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (p) {
      case "HIGH": return "destructive"
      case "MEDIUM": return "warning"
      default: return "secondary"
    }
  }

  const getStatusBadgeColor = (s: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (s) {
      case "DONE": return "success"
      case "REVIEW": return "default"
      case "IN_PROGRESS": return "secondary"
      default: return "outline"
    }
  }

  const handleOpenDetails = (id: string) => {
    setDetailTaskId(id)
    setDetailOpen(true)
  }

  const handleOpenEdit = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    setEditTask(task)
    setFormOpen(true)
  }

  const handleSuccess = () => {
    refetchTasks()
    queryClient.invalidateQueries({ queryKey: ["tasks-column"] })
    toast("Task synchronized successfully.", "success")
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operation Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assign, schedule, and track manual infrastructure operations.
          </p>
        </div>
        
        {canManage && (
          <Button onClick={() => { setEditTask(null); setFormOpen(true); }} size="sm" className="gap-1.5 self-start sm:self-auto font-medium">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        )}
      </div>

      <Card className="glass-card shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-50/50 dark:bg-zinc-900/50"
              />
            </div>

            <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-900 shrink-0">
              <button
                onClick={() => setView("board")}
                className={cn(
                  "p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all",
                  view === "board"
                    ? "bg-card text-foreground shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Board View"
              >
                <Kanban className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                onClick={() => setView("table")}
                className={cn(
                  "p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all",
                  view === "table"
                    ? "bg-card text-foreground shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Table View"
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-muted-foreground">Filters:</span>
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="flex h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card px-2.5 py-0 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="REVIEW">REVIEW</option>
              <option value="DONE">DONE</option>
            </select>

            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value)
                setPage(1)
              }}
              className="flex h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card px-2.5 py-0 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>

            {canManage && (
              <select
                value={assignee}
                onChange={(e) => {
                  setAssignee(e.target.value)
                  setPage(1)
                }}
                className="flex h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card px-2.5 py-0 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Assignees</option>
                {usersData?.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.userName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {isCurrentlyLoading ? (
        <div className="py-20 flex items-center justify-center">
          <LoadingState message="Fetching system operations log..." />
        </div>
      ) : tasksErrorCombined ? (
        <ErrorState
          title="Log Retrieval Failed"
          message="Could not connect to the system database logs."
          onRetry={refetchCombined}
        />
      ) : (view === "table" ? filteredTasks.length === 0 : totalBoardTasksCount === 0) ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks match criteria"
          description={search ? "Try refining your search text." : "Deploy a new task to start tracking work."}
          actionLabel={canManage ? "New Task" : undefined}
          onAction={canManage ? () => { setEditTask(null); setFormOpen(true); } : undefined}
        />
      ) : view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start select-none">
          {[
            { id: "TODO", label: "To Do", dotColor: "bg-zinc-400 dark:bg-zinc-650" },
            { id: "IN_PROGRESS", label: "In Progress", dotColor: "bg-blue-500" },
            { id: "REVIEW", label: "In Review", dotColor: "bg-amber-500" },
            { id: "DONE", label: "Completed", dotColor: "bg-emerald-500" },
          ].map((column) => {
            const colId = column.id as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
            const colData = colId === "TODO" ? todoData : colId === "IN_PROGRESS" ? inProgressData : colId === "REVIEW" ? reviewData : doneData
            const rawTasks = colData?.tasks || []
            const columnTasks = rawTasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
            const totalCountInDb = colData?.totalCount || 0
            const isDragOver = dragOverStatus === column.id

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(e) => handleDrop(e, column.id as any)}
                className={cn(
                  "flex flex-col rounded-xl p-3 min-h-[400px] border transition-all duration-355",
                  isDragOver 
                    ? "bg-primary/[0.04] dark:bg-primary/[0.02] border-primary/45 border-dashed scale-[1.01] shadow-sm"
                    : "bg-zinc-50/30 dark:bg-zinc-900/10 border-zinc-150 dark:border-zinc-850"
                )}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", column.dotColor)} />
                    <span className="text-xs font-bold text-foreground tracking-tight">{column.label}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-850 text-muted-foreground border border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
                      {totalCountInDb}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-0.5">
                  {columnTasks.length === 0 ? (
                    <div className="h-20 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-lg text-center p-3">
                      <span className="text-[10px] font-medium text-muted-foreground">Drop tasks here</span>
                    </div>
                  ) : (
                    <>
                      {columnTasks.map((task) => {
                        const isUpdating = updatingTaskId === task.id
                        const isDraggable = canManage || task.assignedTo === user?.id
                        
                        return (
                          <div
                            key={task.id}
                            draggable={isDraggable}
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleOpenDetails(task.id)}
                            className={cn(
                              "group flex flex-col p-4 rounded-xl border bg-card text-left transition-all duration-200 shadow-sm relative",
                              isDraggable 
                                ? "cursor-grab active:cursor-grabbing hover:border-zinc-300 dark:hover:border-zinc-750 hover:shadow-md" 
                                : "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-750",
                              isUpdating && "opacity-60 pointer-events-none"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <Badge 
                                variant={getPriorityBadgeColor(task.priority)} 
                                className="text-[9px] px-1.5 py-0 uppercase tracking-wider font-semibold"
                              >
                                {task.priority}
                              </Badge>

                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-zinc-400 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => handleOpenEdit(e, task)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-foreground leading-snug tracking-tight mb-3 line-clamp-2">
                              {task.title}
                            </h4>

                            <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-850 text-[10px] text-muted-foreground">
                              {task.dueDate ? (
                                <span className="flex items-center gap-1 font-medium">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              ) : (
                                <span />
                              )}
                              
                              <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[8px] uppercase shrink-0">
                                  {(task.assignee?.name || "Unassigned").split(" ").map((n: string) => n[0]).join("")}
                                </div>
                                <span className="truncate max-w-[85px] text-[9px] font-semibold text-muted-foreground">
                                  {task.assignee?.name || "Unassigned"}
                                </span>
                              </div>
                            </div>

                            {isUpdating && (
                              <div className="absolute inset-0 bg-background/50 backdrop-blur-[0.5px] flex items-center justify-center rounded-xl">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {getColumnHasMore(column.id as any) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={colId === "TODO" ? todoFetching : colId === "IN_PROGRESS" ? inProgressFetching : colId === "REVIEW" ? reviewFetching : doneFetching}
                          onClick={() => handleLoadMore(column.id as any)}
                          className="w-full mt-2 text-xs py-1 h-7 border-dashed border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 text-muted-foreground hover:text-foreground font-semibold flex items-center justify-center gap-1.5"
                        >
                          {(colId === "TODO" ? todoFetching : colId === "IN_PROGRESS" ? inProgressFetching : colId === "REVIEW" ? reviewFetching : doneFetching) ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-zinc-400" /> Loading...
                            </>
                          ) : (
                            "+ Load More"
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : isMobile ? (
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              onClick={() => handleOpenDetails(task.id)}
              className="glass-card shadow-sm cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-4 space-y-3 text-left">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                    {task.title}
                  </h3>
                  <Badge variant={getStatusBadgeColor(task.status)} className="text-[9px] px-1.5 py-0.5 shrink-0 uppercase">
                    {task.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-zinc-100 dark:border-zinc-850 pt-2.5">
                  <div className="flex gap-2.5">
                    <Badge variant={getPriorityBadgeColor(task.priority)} className="text-[9px] px-1 py-0 uppercase">
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <User className="h-3 w-3" /> {task.assignee?.name || "Unassigned"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-zinc-650 dark:text-zinc-300 pl-6">Title</TableHead>
                <TableHead className="font-semibold text-zinc-650 dark:text-zinc-300">Status</TableHead>
                <TableHead className="font-semibold text-zinc-650 dark:text-zinc-300">Priority</TableHead>
                <TableHead className="font-semibold text-zinc-650 dark:text-zinc-300">Assignee</TableHead>
                <TableHead className="font-semibold text-zinc-650 dark:text-zinc-300">Due Date</TableHead>
                {canManage && (
                  <TableHead className="text-right pr-6 font-semibold text-zinc-650 dark:text-zinc-300">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  onClick={() => handleOpenDetails(task.id)}
                  className="cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-850"
                >
                  <TableCell className="font-medium text-foreground text-left max-w-sm truncate pl-6">
                    {task.title}
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge variant={getStatusBadgeColor(task.status)} className="text-[10px] py-0">
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge variant={getPriorityBadgeColor(task.priority)} className="text-[10px] py-0">
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="text-xs text-muted-foreground">
                      {task.assignee?.name || "Unassigned"}
                    </span>
                  </TableCell>
                  <TableCell className="text-left text-xs text-muted-foreground">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                  {canManage && (
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-foreground"
                          onClick={(e) => handleOpenEdit(e, task)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      )}

      {view === "table" && tasksData && tasksData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Total count: {tasksData.totalCount} tasks
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">
              Page {page} of {tasksData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === tasksData.totalPages}
              onClick={() => setPage((p) => Math.min(tasksData.totalPages, p + 1))}
              className="h-8 px-2.5"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editTask}
        onSuccess={handleSuccess}
      />

      <TaskDetailModal
        taskId={detailTaskId}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetailTaskId(null)
          refetchTasks()
          queryClient.invalidateQueries({ queryKey: ["tasks-column"] })
        }}
      />
    </div>
  )
}
