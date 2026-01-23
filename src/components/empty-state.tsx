"use client";

import Link from "next/link";
import { FileQuestion, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-documents" | "no-results";
  searchQuery?: string;
}

export function EmptyState({ type, searchQuery }: EmptyStateProps) {
  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Search className="h-8 w-8 !text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold  text-slate-800">
          No results found
        </h3>
        <p className="mb-4 max-w-sm text-muted-foreground">
          We couldn&apos;t find &quot;{searchQuery}&quot;. Try different
          keywords or browse by category.
        </p>
        <Link href="/upload">
        <Button className="rounded-full bg-linear-to-r from-blue-500 to-indigo-600 !px-7 !py-6 !font-large text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30">
          <Upload className="mr-2 h-8 w-8" />
          Upload
        </Button>
      </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        No documents yet
      </h3>
      <p className="mb-4 max-w-sm text-muted-foreground">
        Be the first to upload study materials in this category and help other
        students!
      </p>
      <Link href="/upload">
        <Button className="rounded-full bg-linear-to-r from-blue-500 to-indigo-600 !px-7 !py-6 !font-large text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30">
          <Upload className="mr-2 h-8 w-8" />
          Upload
        </Button>
      </Link>
    </div>
  );
}
