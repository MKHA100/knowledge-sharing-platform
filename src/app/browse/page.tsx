"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SharedNavbar } from "@/components/shared-navbar";
import { DocumentCard } from "@/components/document-card";
import { DocumentOverlay } from "@/components/document-overlay";
import { ThankYouPopup } from "@/components/thank-you-popup";
import { LoginModal } from "@/components/login-modal";
import { EmptyState } from "@/components/empty-state";
import { AppProvider, useApp } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";
import { api } from "@/lib/api/client";
import { getSubjectDisplayName, SUBJECTS } from "@/lib/constants/subjects";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, SlidersHorizontal } from "lucide-react";
import type { DocumentWithUploader } from "@/types";

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get("subject");
  const initialQuery = searchParams.get("q");
  const initialMedium = searchParams.get("medium") || "all";

  const { setShowLoginModal } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    initialSubject,
  );
  const [medium, setMedium] = useState(initialMedium);
  const [documentType, setDocumentType] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");

  const [documents, setDocuments] = useState<DocumentWithUploader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ books: 0, shortNotes: 0, papers: 0 });

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {};

        if (searchQuery) params.query = searchQuery;
        if (selectedSubject && selectedSubject !== "all")
          params.subject = selectedSubject;
        if (medium !== "all") params.medium = medium;
        if (documentType !== "all") params.documentType = documentType;
        if (sortBy) params.sortBy = sortBy;

        const response = await api.documents.list(params);

        if (response.success) {
          const items: DocumentWithUploader[] = response.data?.items || [];
          setDocuments(items);
          setTotal(response.data?.total || 0);

          // Calculate counts for each document type
          const bookCount = items.filter(
            (d: DocumentWithUploader) => d.type === "book",
          ).length;
          const shortNoteCount = items.filter(
            (d: DocumentWithUploader) => d.type === "short_note",
          ).length;
          const paperCount = items.filter(
            (d: DocumentWithUploader) => d.type === "paper",
          ).length;

          setCounts({
            books: bookCount,
            shortNotes: shortNoteCount,
            papers: paperCount,
          });
        } else {
          setError(response.error || "Failed to load documents");
        }
      } catch (err) {
        setError("Failed to load documents. Please try again.");
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [searchQuery, selectedSubject, medium, documentType, sortBy]);

  const selectedSubjectName = selectedSubject
    ? getSubjectDisplayName(selectedSubject)
    : null;

  // Get popular subjects to display
  const popularSubjects = SUBJECTS.slice(0, 20);

  // Scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <SharedNavbar
        variant="browse"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Spacer for fixed navbar */}
      <div className="h-24" />

      <main className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6">
        {/* Subject Filter Pills - Pexels Style */}
        <div className="relative mb-8 mt-4">
          {/* Filters Button */}
          <div className="flex items-center gap-2">
            {/* <button className="mr-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button> */}

            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Scrollable Subject Pills */}
            <div
              ref={scrollContainerRef}
              className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                onClick={() => setSelectedSubject(null)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  !selectedSubject || selectedSubject === "all"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                All Subjects
              </button>
              {popularSubjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                    selectedSubject === subject.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {subject.displayName}
                </button>
              ))}
            </div>

            {/* Right Scroll Button */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            {searchQuery
              ? `${searchQuery}`
              : selectedSubjectName
                ? `${selectedSubjectName} Documents`
                : "All Documents"}
          </h1>
        </div>

        {/* Document Type Tabs & Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200">
          {/* Tabs */}
          <div className="flex gap-8">
            <button
              onClick={() => setDocumentType("all")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                documentType === "all"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              All
              {documentType === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              <span className="ml-2 text-slate-400">
                {loading ? "..." : total.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => setDocumentType("book")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                documentType === "book"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Books
              {documentType === "book" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              <span className="ml-2 text-slate-400">
                {loading ? "..." : counts.books.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => setDocumentType("short_note")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                documentType === "short_note"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Short Notes
              {documentType === "short_note" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              <span className="ml-2 text-slate-400">
                {loading ? "..." : counts.shortNotes.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => setDocumentType("paper")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                documentType === "paper"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Papers
              {documentType === "paper" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              <span className="ml-2 text-slate-400">
                {loading ? "..." : counts.papers.toLocaleString()}
              </span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 pb-4">
            {/* Language Selector */}
            <Select value={medium} onValueChange={setMedium}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-300 bg-white text-sm">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="sinhala">Sinhala</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="tamil">Tamil</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-300 bg-white text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="downloads">Most Downloads</SelectItem>
                <SelectItem value="upvotes">Most Upvotes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl bg-red-50 p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Document Grid - Masonry style like Pexels */}
        {!loading && !error && documents.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && documents.length === 0 && (
          <EmptyState
            type={selectedSubject ? "no-documents" : "no-results"}
            searchQuery={searchQuery}
          />
        )}

        {/* Load More / Results Count */}
        {!loading && documents.length > 0 && documents.length < total && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500">
              Showing {documents.length} of {total.toLocaleString()} documents
            </p>
            <Button
              variant="outline"
              className="gap-2 rounded-full px-8"
              onClick={() => {
                // TODO: Implement load more functionality
              }}
            >
              Load More
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <DocumentOverlay />
      <ThankYouPopup />
      <LoginModal />
    </div>
  );
}

function BrowsePage() {
  return (
    <Suspense fallback={<BrowseLoadingSkeleton />}>
      <BrowseContent />
    </Suspense>
  );
}

function BrowseLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-24" />
      <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6">
        <div className="mb-6 flex gap-3 overflow-x-auto">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <Skeleton className="mb-8 h-10 w-64" />
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex gap-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Browse() {
  return (
    <AppProvider>
      <ToastProvider />
      <BrowsePage />
    </AppProvider>
  );
}
