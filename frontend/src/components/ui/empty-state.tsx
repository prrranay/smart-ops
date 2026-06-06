import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 min-h-[320px] transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/80",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/40 dark:border-zinc-800/40 text-muted-foreground mb-4 shadow-sm">
        <Icon className="h-5.5 w-5.5 text-zinc-600 dark:text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="h-8 text-xs font-semibold shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
export default EmptyState
