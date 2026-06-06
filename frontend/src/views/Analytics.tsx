import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Cpu, Server } from "lucide-react"

export default function Analytics() {
  const metrics = [
    { title: "Average Response Time", value: "84ms", icon: Cpu, subtext: "14ms improvement vs yesterday" },
    { title: "Network Bandwidth", value: "1.2 Gbps", icon: Server, subtext: "Stable traffic levels" },
    { title: "Daily API Calls", value: "4.8 Million", icon: TrendingUp, subtext: "Peak rate: 320 req/sec" },
  ]

  return (
    <div className="space-y-6 text-left page-enter">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Detailed telemetry, performance trends, and usage metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>System Telemetry Insights</CardTitle>
          <CardDescription>Visual metrics reports will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg border-zinc-200 dark:border-zinc-800">
          <BarChart3 className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
          <p className="text-sm font-medium">Graph Engine Loading</p>
          <p className="text-xs text-muted-foreground mt-1">Telemetry streams are active and syncing...</p>
        </CardContent>
      </Card>
    </div>
  )
}
