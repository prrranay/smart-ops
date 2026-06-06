import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Lock, Database, Shield } from "lucide-react"
import { useToast } from "@/hooks/useToast"

export default function Settings() {
  const { toast } = useToast()
  const sections = [
    { title: "Notification Preferences", desc: "Configure email alerts and operational reports thresholds.", icon: Bell },
    { title: "Security Credentials", desc: "Manage authentication mechanisms and system roles.", icon: Lock },
    { title: "Database Configurations", desc: "Tune backup schedules, connections, and storage indexes.", icon: Database },
    { title: "Compliance Policies", desc: "Audit trail logging retention periods and configurations.", icon: Shield },
  ]

  const handleSectionClick = (title: string) => {
    toast(`${title} is currently managed under system-wide admin policies.`, "info")
  }

  return (
    <div className="space-y-6 text-left page-enter">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure operational thresholds, alerts, credentials, and settings.
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((sec) => (
          <Card key={sec.title} className="glass-card cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors" onClick={() => handleSectionClick(sec.title)}>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5">
              <div className="h-10 w-10 rounded-lg bg-zinc-150 dark:bg-zinc-850/60 flex items-center justify-center flex-shrink-0 border border-zinc-200/50 dark:border-zinc-800/50">
                <sec.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">{sec.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-normal">{sec.desc}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
