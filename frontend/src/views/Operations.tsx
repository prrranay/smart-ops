import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Terminal, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"

export default function Operations() {
  const { toast } = useToast()
  const [operations, setOperations] = useState([
    { id: "1", name: "Re-index ElasticSearch Database", category: "Database", status: "Idle", lastRun: "2 days ago" },
    { id: "2", name: "Flush Redis Caches", category: "Cache", status: "Idle", lastRun: "12 hours ago" },
    { id: "3", name: "Sync CRM Operations", category: "Integration", status: "Active", lastRun: "Running now" },
    { id: "4", name: "Backup Primary Database Postgres", category: "Database", status: "Idle", lastRun: "Yesterday" },
  ])

  const toggleStatus = (id: string) => {
    setOperations((prev) =>
      prev.map((op) => {
        if (op.id === id) {
          const nextStatus = op.status === "Active" ? "Idle" : "Active"
          toast(
            `${op.name} is now ${nextStatus.toLowerCase()}`,
            nextStatus === "Active" ? "success" : "info"
          )
          return {
            ...op,
            status: nextStatus,
            lastRun: nextStatus === "Active" ? "Running now" : "Just now",
          }
        }
        return op
      })
    )
  }

  return (
    <div className="space-y-6 text-left page-enter">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Operations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Trigger and manage background system actions and operations tasks.
        </p>
      </div>

      <div className="grid gap-4">
        {operations.map((op) => (
          <Card key={op.id} className="glass-card">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-zinc-150 dark:bg-zinc-850/60 flex items-center justify-center flex-shrink-0 border border-zinc-200/50 dark:border-zinc-800/50">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{op.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Category: {op.category}</span>
                    <span>•</span>
                    <span>Last Run: {op.lastRun}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  op.status === "Active"
                    ? "bg-primary/10 text-primary animate-pulse"
                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                }`}>
                  {op.status}
                </span>
                
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => toggleStatus(op.id)}>
                  {op.status === "Active" ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Execute
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
