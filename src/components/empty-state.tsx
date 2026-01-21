"use client"

import Link from "next/link"
import { FileQuestion, Search, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  type: "no-documents" | "no-results"
  searchQuery?: string
}

export function EmptyState({ type, searchQuery }: EmptyStateProps) {
  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">No results found</h3>
        <p className="mb-4 max-w-sm text-muted-foreground">
          We couldn&apos;t find &quot;{searchQuery}&quot;. Try different keywords or browse by category.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">No documents yet</h3>
      <p className="mb-4 max-w-sm text-muted-foreground">
        Be the first to upload study materials in this category and help other students!
      </p>
      <Link href="/upload">
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Upload className="h-4 w-4" />
          Upload Now
        </Button>
      </Link>
    </div>
  )
}
