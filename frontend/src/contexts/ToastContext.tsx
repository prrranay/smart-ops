import React, { createContext, useState, useContext, useCallback } from "react"
import { X, CheckCircle2, AlertOctagon, Info } from "lucide-react"

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
  duration?: number
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info", duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      
      {/* Toast rendering portal container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          let icon = <Info className="h-4 w-4 text-blue-500 shrink-0" />
          let borderTheme = "border-blue-500/20 bg-blue-500/[0.03] dark:bg-blue-950/10"
          if (t.type === "success") {
            icon = <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            borderTheme = "border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-950/10"
          } else if (t.type === "error") {
            icon = <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
            borderTheme = "border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-950/10"
          }

          return (
            <div
              key={t.id}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border glass-panel shadow-lg pointer-events-auto animate-fade-in transition-all duration-300 ${borderTheme}`}
            >
              <div className="flex gap-2.5 items-start">
                <div className="mt-0.5">{icon}</div>
                <p className="text-xs font-medium text-foreground leading-normal text-left">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5 focus:outline-none transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
