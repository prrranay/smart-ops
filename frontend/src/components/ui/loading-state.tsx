import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

export function LoadingState({ message = "Loading operations...", className, ...props }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 min-h-[200px] gap-3",
        className
      )}
      {...props}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60", className)}
      {...props}
    />
  )
}
