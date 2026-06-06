import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Navigate, useNavigate } from "react-router-dom"
import { api } from "@/config/axios"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { ShieldAlert, BookOpen, Flame, Plus, UserPlus, Loader2 } from "lucide-react"

interface UserWorkloadItem {
  userId: string
  userName: string
  score: number
  workloadLevel: "LOW" | "MEDIUM" | "HIGH"
  openTasks: number
  highPriorityTasks: number
}

export default function Team() {
  const { user: curUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"USER" | "MANAGER" | "ADMIN">("USER")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: workload,
    isLoading,
    isError,
    refetch
  } = useQuery<UserWorkloadItem[]>({
    queryKey: ["team-workload-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/workload")
      return res.data.data
    }
  })

  if (curUser && curUser.role === "USER") {
    return <Navigate to="/tasks" replace />
  }

  const overloaded = workload?.filter(m => m.workloadLevel === "HIGH") || []
  const hasOverloaded = overloaded.length > 0
  const isManagerOrAdmin = curUser?.role === "ADMIN" || curUser?.role === "MANAGER"

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    
    try {
      await api.post("/auth/members", {
        name,
        email,
        password,
        role
      })
      
      toast("Team member added successfully!", "success")
      setIsAddModalOpen(false)
      setName("")
      setEmail("")
      setPassword("")
      setRole("USER")
      
      refetch()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to add team member"
      setFormError(msg)
      toast(msg, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <LoadingState message="Retrieving operations workload data..." />

  if (isError) {
    return (
      <ErrorState
        title="Workload Query Failed"
        message="Could not load operator workload distribution stats."
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="space-y-6 text-left page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Workload Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor operational bandwidth, task distribution, and identify overloaded operators in real-time.
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Team Member
          </Button>
        )}
      </div>

      {isManagerOrAdmin && hasOverloaded && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10 text-rose-800 dark:text-rose-350 flex gap-3.5 items-start">
          <div className="p-1 rounded-md bg-rose-500/10 text-rose-500 animate-pulse mt-0.5 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Bandwidth Warning: Overloaded Operators Detected</h4>
            <p className="text-xs leading-relaxed text-rose-700/90 dark:text-rose-450/90">
              {overloaded.map(m => m.userName).join(", ")} {overloaded.length === 1 ? "has" : "have"} exceeded safety thresholds with high workload ratings. Please consider balancing tasks or delegating upcoming items.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tasks")}
                className="h-7 text-[10px] font-semibold border-rose-500/20 bg-transparent text-rose-850 dark:text-rose-350 hover:bg-rose-500/10 hover:text-rose-900 dark:hover:text-rose-200"
              >
                Go to Task Manager
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workload?.map((item) => {
          const pct = Math.min(Math.round((item.score / 30) * 100), 100)
          
          return (
            <Card key={item.userId} className="glass-card flex flex-col justify-between overflow-hidden group">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 space-y-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                  {item.userName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5 text-left">
                  <CardTitle className="text-sm font-bold truncate">{item.userName}</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                    Operator Unit
                  </CardDescription>
                </div>
                <Badge
                  className={`text-[9px] font-bold tracking-wider px-2 py-0.5 select-none shrink-0 ${
                    item.workloadLevel === "HIGH"
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse font-extrabold"
                      : item.workloadLevel === "MEDIUM"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }`}
                  variant="outline"
                >
                  {item.workloadLevel} LOAD
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-muted-foreground">Workload Score</span>
                      <span className={
                        item.workloadLevel === "HIGH" ? "text-rose-500 font-bold" :
                        item.workloadLevel === "MEDIUM" ? "text-amber-500" : "text-emerald-500"
                      }>
                        {item.score} pts / 30 max
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.workloadLevel === "HIGH" ? "bg-rose-500" :
                          item.workloadLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/80 text-left">
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase">
                        <BookOpen className="h-3 w-3 text-zinc-400" /> Open Tasks
                      </div>
                      <p className="text-sm font-bold text-foreground mt-0.5">{item.openTasks}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/80 text-left">
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase">
                        <Flame className="h-3 w-3 text-rose-400" /> High Priority
                      </div>
                      <p className="text-sm font-bold text-foreground mt-0.5">{item.highPriorityTasks}</p>
                    </div>
                  </div>
                </div>

                {isManagerOrAdmin && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/tasks?assignee=${item.userName}`)}
                      className="w-full text-center text-xs h-8 text-primary hover:bg-primary/5 hover:text-primary-semibold font-medium justify-center"
                    >
                      Balance Operator Tasks
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
        description="Create a new operator account for your organization."
      >
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-xs">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              Full Name
            </label>
            <Input
              required
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              Email Address
            </label>
            <Input
              required
              type="email"
              placeholder="e.g. alex@ops.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              Password
            </label>
            <Input
              required
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              Organization Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              disabled={isSubmitting}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            >
              <option value="USER" className="dark:bg-zinc-900">Operator (USER)</option>
              <option value="MANAGER" className="dark:bg-zinc-900">Manager (MANAGER)</option>
              <option value="ADMIN" className="dark:bg-zinc-900">Admin (ADMIN)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Operator
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
