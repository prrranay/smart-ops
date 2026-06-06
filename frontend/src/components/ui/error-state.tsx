import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = "An error occurred",
  message,
  onRetry,
  retryLabel = "Try Again",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-rose-500/10 bg-rose-500/[0.02] dark:bg-rose-950/5 min-h-[220px] transition-all duration-300",
        className
      )}
      {...props}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 mb-3.5 border border-rose-500/20 shadow-sm">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold mb-1.5 text-rose-800 dark:text-rose-450">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="h-8 text-xs font-semibold border-rose-500/25 text-rose-800 dark:text-rose-450 hover:bg-rose-500/10 hover:text-rose-900 dark:hover:text-rose-200 transition-all">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
export default ErrorState
