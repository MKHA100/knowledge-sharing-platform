"use client"

import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#ffffff",
          color: "#1e293b",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        },
        classNames: {
          success: "!bg-emerald-50 !text-emerald-900 !border-emerald-200",
          error: "!bg-rose-50 !text-rose-900 !border-rose-200",
          warning: "!bg-amber-50 !text-amber-900 !border-amber-200",
          info: "!bg-blue-50 !text-blue-900 !border-blue-200",
          description: "!text-slate-600",
        },
      }}
    />
  )
}
