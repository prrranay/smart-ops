import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/config/axios"
import { useAuth } from "@/hooks/useAuth"
import { formatRelativeTime } from "@/lib/relative-time"
import { useToast } from "@/hooks/useToast"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import {
  User,
  Shield,
  MessageSquare,
  History,
  Check,
  Edit2,
  Loader2
} from "lucide-react"

// Types
interface TaskDetail {
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

interface Comment {
  id: string
  content: string
  createdAt: string
  author?: {
    name: string
    email: string
  } | null
}

interface ActivityLog {
  id: string
  action: string
  entityId: string
  entityType: string
  createdAt: string
  user: {
    name: string
  }
}

interface UserWorkload {
  userId: string
  userName: string
}

interface TaskDetailModalProps {
  taskId: string | null
  open: boolean
  onClose: () => void
}

export function TaskDetailModal({ taskId, open, onClose }: TaskDetailModalProps) {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Inline editing state for Title and Description
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editedDesc, setEditedDesc] = useState("")

  // Comments state
  const [newComment, setNewComment] = useState("")
  const [commentError, setCommentError] = useState<string | null>(null)
  const isOperatorOrAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER"

  // 1. Fetch Task Detail
  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
    refetch: refetchTask
  } = useQuery<TaskDetail>({
    queryKey: ["task-details", taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`)
      return res.data.data
    },
    enabled: !!taskId && open,
  })

  // Initialize edit fields once task data is loaded
  useState(() => {
    if (task) {
      setEditedTitle(task.title)
      setEditedDesc(task.description)
    }
  })

  // 2. Fetch Comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
    refetch: refetchComments
  } = useQuery<{ comments: Comment[] }>({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/comments`)
      return res.data.data
    },
    enabled: !!taskId && open
  })

  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on comment update
  useEffect(() => {
    if (commentsData?.comments) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 80)
    }
  }, [commentsData?.comments])

  // 3. Fetch Activity Timeline logs (to filter for this task)
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    refetch: refetchActivities
  } = useQuery<{ activities: ActivityLog[] }>({
    queryKey: ["activities-timeline"],
    queryFn: async () => {
      const res = await api.get("/activities", { params: { limit: 100 } })
      return res.data.data
    },
    enabled: !!taskId && open
  })

  // 4. Fetch Users list (for assignee selection dropdown)
  const { data: usersData } = useQuery<UserWorkload[]>({
    queryKey: ["active-users-workload"],
    queryFn: async () => {
      const res = await api.get("/dashboard/workload")
      return res.data.data
    },
    enabled: !!taskId && open && isOperatorOrAdmin
  })

  // Filter activities related to this task
  const taskActivities = activitiesData?.activities.filter(
    (log) => log.entityId === taskId && log.entityType === "TASK"
  ) || []

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async (fields: Partial<TaskDetail>) => {
      await api.patch(`/tasks/${taskId}`, fields)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-details", taskId] })
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] })
      queryClient.invalidateQueries({ queryKey: ["activities-timeline"] })
      toast("Task updated successfully", "success")
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update task details", "error")
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/tasks/${taskId}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-details", taskId] })
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      queryClient.invalidateQueries({ queryKey: ["activities-timeline"] })
      toast("Task status updated successfully", "success")
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update status", "error")
    }
  })

  const updateAssigneeMutation = useMutation({
    mutationFn: async (assignedTo: string | null) => {
      await api.post(`/tasks/${taskId}/assign`, { assignedTo })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-details", taskId] })
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] })
      queryClient.invalidateQueries({ queryKey: ["activities-timeline"] })
      toast("Task assignee updated", "success")
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update assignee", "error")
    }
  })

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/tasks/${taskId}/comments`, { content })
    },
    onSuccess: () => {
      setNewComment("")
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] })
      queryClient.invalidateQueries({ queryKey: ["activities-timeline"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] })
      toast("Comment posted successfully", "success")
    },
    onError: (err: any) => {
      setCommentError(err.message || "Failed to post comment.")
      toast(err.message || "Failed to post comment.", "error")
    }
  })

  // Inline edit handlers
  const saveTitle = () => {
    const trimmed = editedTitle.trim()
    if (!trimmed) {
      toast("Task title is required", "error")
      return
    }
    if (trimmed.length < 3) {
      toast("Task title must be at least 3 characters long", "error")
      return
    }
    if (trimmed.length > 100) {
      toast("Task title cannot exceed 100 characters", "error")
      return
    }
    if (trimmed !== task?.title) {
      updateTaskMutation.mutate({ title: trimmed })
    }
    setIsEditingTitle(false)
  }

  const saveDesc = () => {
    const trimmed = editedDesc.trim()
    if (!trimmed) {
      toast("Task description is required", "error")
      return
    }
    if (trimmed.length > 1000) {
      toast("Task description cannot exceed 1000 characters", "error")
      return
    }
    if (trimmed !== task?.description) {
      updateTaskMutation.mutate({ description: trimmed })
    }
    setIsEditingDesc(false)
  }

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault()
    setCommentError(null)
    const trimmed = newComment.trim()
    if (!trimmed) {
      toast("Comment content cannot be empty", "error")
      return
    }
    if (trimmed.length > 1000) {
      toast("Comment content cannot exceed 1000 characters", "error")
      return
    }
    addCommentMutation.mutate(trimmed)
  }

  const formatActivityAction = (act: string) => {
    return act
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  }

  const getPriorityBadgeColor = (p: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (p) {
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "warning"
      default:
        return "secondary"
    }
  }

  const isLoading = taskLoading || commentsLoading || activitiesLoading

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
    >
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <LoadingState message="Fetching detailed logs..." />
        </div>
      ) : taskError ? (
        <div className="py-6">
          <ErrorState
            title="Failed to Retrieve Details"
            message="The task details could not be loaded."
            onRetry={() => {
              refetchTask()
              refetchComments()
              refetchActivities()
            }}
          />
        </div>
      ) : task ? (
        <div className="flex flex-col gap-6 h-full">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Task ID: {task.id.slice(0, 8)}
                </span>
                <Badge variant={getPriorityBadgeColor(task.priority)}>
                  {task.priority} Priority
                </Badge>
              </div>

              {/* Editable Title */}
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                    className="text-lg font-bold h-9 py-0.5"
                    autoFocus
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={saveTitle}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h2
                  className={`text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-1 ${
                    isOperatorOrAdmin ? "group cursor-pointer hover:text-primary transition-colors" : ""
                  }`}
                  onClick={() => {
                    if (isOperatorOrAdmin) {
                      setEditedTitle(task.title)
                      setIsEditingTitle(true)
                    }
                  }}
                >
                  <span>{task.title}</span>
                  {isOperatorOrAdmin && (
                    <Edit2 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  )}
                </h2>
              )}
            </div>

            {/* Sticky/Header Status Toggler */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Status</span>
                <select
                  value={task.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                  className="flex h-8 rounded-lg border border-input bg-card px-2.5 py-0 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="TODO">TODO (Pending)</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="REVIEW">REVIEW (Verify)</option>
                  <option value="DONE">DONE (Closed)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid Body */}
          <div className="grid gap-6 md:grid-cols-5 text-left flex-1 min-h-0">
            {/* Left Content (3/5 width) */}
            <div className="md:col-span-3 space-y-6 flex flex-col min-h-0">
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Task Description
                  </h3>
                  {!isEditingDesc && isOperatorOrAdmin && (
                    <button
                      onClick={() => {
                        setEditedDesc(task.description)
                        setIsEditingDesc(true)
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      rows={4}
                      className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveDesc}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-150 dark:border-zinc-850">
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {task.description || "No description provided."}
                    </p>
                  </div>
                )}
              </div>

              {/* Assignment Information */}
              <div className="grid grid-cols-2 gap-4 border-y border-zinc-200 dark:border-zinc-800 py-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Created By
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                      <Shield className="h-3 w-3 text-zinc-500" />
                    </div>
                    <span className="text-xs font-medium">{task.creator?.name || "System"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Assigned Operator
                  </span>
                  {isOperatorOrAdmin ? (
                    <select
                      value={task.assignedTo || "unassigned"}
                      onChange={(e) => {
                        const val = e.target.value === "unassigned" ? null : e.target.value
                        updateAssigneeMutation.mutate(val)
                      }}
                      className="flex h-7 mt-1 rounded-md border border-input bg-card px-2 py-0 text-xs shadow-sm"
                    >
                      <option value="unassigned">Unassigned</option>
                      {usersData?.map((u) => (
                        <option key={u.userId} value={u.userId}>
                          {u.userName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-850 flex items-center justify-center">
                        <User className="h-3 w-3 text-zinc-500" />
                      </div>
                      <span className="text-xs font-medium">
                        {task.assignee?.name || "Unassigned"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Panel */}
              <div className="space-y-4 flex-1 flex flex-col min-h-[200px]">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Comments ({commentsData?.comments.length || 0})
                </h3>

                {/* Comment Input */}
                <form onSubmit={submitComment} className="space-y-2">
                  <textarea
                    placeholder="Add operational notes or comments..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-xs shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary min-h-[60px]"
                  />
                  {commentError && (
                    <p className="text-[10px] text-destructive dark:text-red-400 font-semibold">
                      {commentError}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      size="sm"
                      className="h-8 text-xs font-medium"
                    >
                      {addCommentMutation.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                          Posting...
                        </>
                      ) : (
                        "Comment"
                      )}
                    </Button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 scroll-smooth overflow-y-auto max-h-[240px] flex-1 pr-1">
                  {commentsLoading ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2].map((n) => (
                        <div key={n} className="flex gap-3 text-left">
                          <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : commentsData?.comments && commentsData.comments.length > 0 ? (
                    <>
                      {commentsData.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-left group">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            {(comment.author?.name || "Unknown").split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {comment.author?.name || "Unknown User"}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-normal shrink-0">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50/70 dark:bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-850">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2 stroke-[1.5]" />
                      <p className="text-xs font-semibold text-foreground dark:text-zinc-350">No comments yet</p>
                      <p className="text-[10px] text-zinc-400">Be the first to share an update on this task.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Content (2/5 width) - Activity Timeline */}
            <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-zinc-250 dark:border-zinc-800 pt-6 md:pt-0 md:pl-6 space-y-4 flex flex-col min-h-0">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Task Timeline
              </h3>

              <div className="space-y-4 overflow-y-auto max-h-[480px] flex-1 pr-1">
                {taskActivities.length > 0 ? (
                  taskActivities.map((act) => (
                    <div key={act.id} className="relative pl-4 border-l border-zinc-200 dark:border-zinc-850 pb-4 last:pb-0">
                      {/* Timeline dot */}
                      <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <div className="text-left space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">
                          {formatActivityAction(act.action)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          By {act.user?.name || "System"}
                        </p>
                        <span className="text-[9px] text-zinc-400 block">
                          {new Date(act.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No activity logs recorded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
export default TaskDetailModal
