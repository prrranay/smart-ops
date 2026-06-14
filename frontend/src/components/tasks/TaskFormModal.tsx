import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/config/axios"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Modal } from "@/components/ui/modal"
import { Drawer } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw, Loader2 } from "lucide-react"

import { useToast } from "@/hooks/useToast"

// Zod schema for task forms
const taskSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must not exceed 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must not exceed 1000 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assignedTo: z.string().nullable().transform(val => val === "unassigned" || val === "" ? null : val),
  dueDate: z
    .string()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true
        const selectedDate = new Date(val)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)
        return selectedDate.getTime() >= today.getTime()
      },
      {
        message: "Due date cannot be in the past",
      }
    )
    .transform((val) => (val === "" ? null : val)),
})

type TaskFormValues = z.infer<typeof taskSchema>

interface UserWorkload {
  userId: string
  userName: string
}

interface Task {
  id: string
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null
  assignedTo: string | null
  assignee?: {
    id: string
    name: string
  } | null
}

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null // If present, edit mode. Otherwise, create mode.
  onSuccess?: () => void
}

export function TaskFormModal({ open, onClose, task, onSuccess }: TaskFormModalProps) {
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const queryClient = useQueryClient()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)

  const onInvalid = (errors: any) => {
    Object.values(errors).forEach((err: any) => {
      if (err.message) {
        toast(err.message, "error")
      }
    })
  }

  // Fetch active users list from workload endpoint for the assignee dropdown
  const { data: usersData } = useQuery<UserWorkload[]>({
    queryKey: ["active-users-workload"],
    queryFn: async () => {
      const res = await api.get("/dashboard/workload")
      return res.data.data
    },
    enabled: open
  })

  // Format date helper for html5 date input (YYYY-MM-DD)
  const formatInputDate = (isoString: string | null | undefined) => {
    if (!isoString) return ""
    return isoString.split("T")[0]
  }

  const defaultValues: TaskFormValues = {
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "MEDIUM",
    assignedTo: task?.assignedTo || "unassigned",
    dueDate: formatInputDate(task?.dueDate) || "",
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  })

  // Reset form values when task prop changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignedTo: task.assignedTo || "unassigned",
        dueDate: formatInputDate(task.dueDate),
      })
    } else {
      reset({
        title: "",
        description: "",
        priority: "MEDIUM",
        assignedTo: "unassigned",
        dueDate: "",
      })
    }
  }, [task, reset, open])

  // Draft Preservation logic for CREATE mode
  const watchedFields = watch()

  // Detect draft on open
  useEffect(() => {
    if (open && !task) {
      const savedDraft = localStorage.getItem("task_create_draft")
      if (savedDraft) {
        setHasDraft(true)
      }
    } else {
      setHasDraft(false)
    }
  }, [open, task])

  // Auto-save draft on value changes in Create mode
  useEffect(() => {
    if (open && !task && !hasDraft) {
      // Check if user has typed anything non-default before saving
      const hasContent =
        watchedFields.title !== "" ||
        watchedFields.description !== "" ||
        watchedFields.priority !== "MEDIUM" ||
        (watchedFields.assignedTo && watchedFields.assignedTo !== "unassigned") ||
        watchedFields.dueDate !== ""

      if (hasContent) {
        localStorage.setItem("task_create_draft", JSON.stringify(watchedFields))
      }
    }
  }, [watchedFields, open, task, hasDraft])

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem("task_create_draft")
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        reset(parsed)
      } catch (e) {
        console.error("Failed to restore draft", e)
      }
    }
    setHasDraft(false)
  }

  const discardDraft = () => {
    localStorage.removeItem("task_create_draft")
    setHasDraft(false)
  }

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      }
      const res = await api.post("/tasks", payload)
      return res.data
    },
    onSuccess: () => {
      localStorage.removeItem("task_create_draft")
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to create task."
      setGlobalError(msg)
      toast(msg, "error")
    }
  })

  // Edit Task Mutation
  const editTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const patchPayload = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      }
      
      // Update general fields
      await api.patch(`/tasks/${task!.id}`, patchPayload)

      // Update assignment separately
      const currentAssignee = task!.assignedTo
      const targetAssignee = data.assignedTo === "unassigned" ? null : data.assignedTo

      if (currentAssignee !== targetAssignee) {
        await api.post(`/tasks/${task!.id}/assign`, { assignedTo: targetAssignee })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] })
      queryClient.invalidateQueries({ queryKey: ["task-details", task!.id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to save changes."
      setGlobalError(msg)
      toast(msg, "error")
    }
  })

  const onSubmit = (data: TaskFormValues) => {
    setGlobalError(null)
    if (task) {
      editTaskMutation.mutate(data)
    } else {
      createTaskMutation.mutate(data)
    }
  }

  const isSubmitting = createTaskMutation.isPending || editTaskMutation.isPending
  const Overlay = isMobile ? Drawer : Modal

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title={task ? "Edit Task" : "Create Operator Task"}
      description={task ? "Modify operational settings of the task" : "Deploy a new task to the system"}
    >
      <div className="space-y-4">
        {/* Draft Restore Alert banner */}
        {hasDraft && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <RotateCcw className="h-4 w-4 shrink-0 text-primary" />
              <span>Restorable draft found for this form.</span>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={restoreDraft} className="text-[10px] h-7 px-2">
                Restore
              </Button>
              <Button size="sm" variant="ghost" onClick={discardDraft} className="text-[10px] h-7 px-2 text-zinc-500">
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {globalError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 p-3 text-xs text-destructive dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 text-left">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              Task Title
            </label>
            <Input
              id="title"
              disabled={isSubmitting}
              placeholder="e.g. Migrate database partition v2"
              className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-[11px] text-destructive dark:text-red-400 font-medium">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              Description / Notes
            </label>
            <textarea
              id="description"
              disabled={isSubmitting}
              placeholder="Write detailed instructions for the operator..."
              rows={4}
              className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[11px] text-destructive dark:text-red-400 font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <label htmlFor="priority" className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
                Priority
              </label>
              <select
                id="priority"
                disabled={isSubmitting}
                className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary"
                {...register("priority")}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label htmlFor="dueDate" className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                disabled={isSubmitting}
                min={new Date().toISOString().split("T")[0]}
                className={errors.dueDate ? "border-destructive focus-visible:ring-destructive" : ""}
                {...register("dueDate")}
              />
              {errors.dueDate && (
                <p className="text-[11px] text-destructive dark:text-red-400 font-medium">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="space-y-1.5">
            <label htmlFor="assignedTo" className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              Assignee
            </label>
            <select
              id="assignedTo"
              disabled={isSubmitting}
              className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary"
              {...register("assignedTo")}
            >
              <option value="unassigned">Unassigned (None)</option>
              {/* Ensure current assignee is always available as an option to prevent accidental unassignment */}
              {task?.assignedTo && task?.assignee && !usersData?.some((u) => u.userId === task.assignedTo) && (
                <option value={task.assignedTo}>
                  {task.assignee.name}
                </option>
              )}
              {usersData?.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.userName}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : task ? (
                "Save Changes"
              ) : (
                "Deploy Task"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  )
}
