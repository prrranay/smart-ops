import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onClose, title, description, children, className }: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    if (open) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />
      {/* Slide-out Drawer Panel */}
      <aside
        className={cn(
          "relative w-full max-w-md h-full bg-card border-l border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl flex flex-col animate-slide-in-right z-10",
          className
        )}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8 text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-850"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Header */}
        {(title || description) && (
          <div className="flex flex-col space-y-1.5 text-left mb-6 pr-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            {title && (
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto text-sm text-left">{children}</div>
      </aside>
    </div>,
    document.body
  )
}
export default Drawer
