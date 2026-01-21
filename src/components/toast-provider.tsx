"use client"

import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        },
        classNames: {
          success: "!bg-primary !text-primary-foreground !border-primary",
        },
      }}
    />
  )
}
