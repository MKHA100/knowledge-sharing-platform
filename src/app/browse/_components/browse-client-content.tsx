"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SharedNavbar } from "@/components/shared-navbar";
import { DocumentCard } from "@/components/document-card";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/app-context";
import { api } from "@/lib/api/client";
import { getSubjectDisplayName, SUBJECTS } from "@/lib/constants/subjects";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDocumentURLRouter } from "@/hooks/useDocumentURLRouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { 
  subjectIdToSlug, 
  createBrowseURL,
  parseBrowseParams,
} from "@/lib/utils/url-params";
import type { DocumentWithUploader } from "@/types";

// Dynamically import heavy components - reduces initial bundle by ~50KB
const DocumentOverlay = dynamic(
  () => import("@/components/document-overlay").then(mod => ({ default: mod.DocumentOverlay })),
  { loading: () => null }
);
const ThankYouPopup = dynamic(
  () => import("@/components/thank-you-popup").then(mod => ({ default: mod.ThankYouPopup })),
  { loading: () => null }
);
const LoginModal = dynamic(
  () => import("@/components/login-modal").then(mod => ({ default: mod.LoginModal })),
  { loading: () => null }
);

interface BrowseClientContentProps {
  /** Subject ID from URL params (null for "all subjects") */
  subjectId: string | null;
}

export function BrowseClientContent({ subjectId }: BrowseClientContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Parse URL params
  const { type, lang, sort, search, doc } = parseBrowseParams(searchParams);
  
  const { setShowLoginModal, setSelectedDocument } = useApp();
  
  // URL router for shareable document links
  const { openDocumentWithURL } = useDocumentURLRouter(
    setSelectedDocument,
    () => setSelectedDocument(null)
  );
  
  // Local state for search input (debounced)
  const [searchQuery, setSearchQuery] = useState(search);
  
  // Documents state
  const [documents, setDocuments] = useState<DocumentWithUploader[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [counts, setCounts] = useState({ books: 0, shortNotes: 0, papers: 0 });

  // Debounced search - update URL after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== search) {
        const url = createBrowseURL({
          subject: subjectId,
          type,
          lang,
          sort,
          search: searchQuery || null,
        });
        router.push(url);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search, subjectId, type, lang, sort, router]);

  // Update URL when filters change
  const updateFilter = useCallback((key: "type" | "lang" | "sort", value: string) => {
    const url = createBrowseURL({
      subject: subjectId,
      type: key === "type" ? value : type,
      lang: key === "lang" ? value : lang,
      sort: key === "sort" ? value : sort,
      search: searchQuery || null,
    });
    router.push(url);
  }, [subjectId, type, lang, sort, searchQuery, router]);

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      setOffset(0); // Reset offset when filters change

      try {
        const params: Record<string, string> = {};

        if (searchQuery) params.query = searchQuery;
        if (subjectId && subjectId !== "all") params.subject = subjectId;
        if (lang !== "all") params.medium = lang;
        if (type !== "all") params.documentType = type;
        if (sort) params.sortBy = sort;

        const response = await api.documents.list(params);

        if (response.success) {
          const items: DocumentWithUploader[] = response.data?.items || [];
          setDocuments(items);
          setTotal(response.data?.total || 0);
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
  }, [searchQuery, subjectId, lang, type, sort]);

  // Fetch counts separately using efficient database aggregates
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const params: Record<string, string> = {};
        if (searchQuery) params.query = searchQuery;
        if (subjectId && subjectId !== "all") params.subject = subjectId;
        if (lang !== "all") params.medium = lang;

        const response = await api.documents.counts(params);
        if (response.success) {
          setCounts(response.data);
        }
      } catch (err) {
        console.error("Error fetching counts:", err);
      }
    };

    fetchCounts();
  }, [searchQuery, subjectId, lang]);

  const selectedSubjectName = subjectId
    ? getSubjectDisplayName(subjectId)
    : null;

  // Show all subjects for comprehensive filtering
  const popularSubjects = useMemo(() => SUBJECTS, []);

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

  // Load more documents
  const loadMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const params: Record<string, string> = {
        offset: String(documents.length), // Use current document count as offset
      };

      if (searchQuery) params.query = searchQuery;
      if (subjectId && subjectId !== "all") params.subject = subjectId;
      if (lang !== "all") params.medium = lang;
      if (type !== "all") params.documentType = type;
      if (sort) params.sortBy = sort;

      const response = await api.documents.list(params);

      if (response.success) {
        const newItems: DocumentWithUploader[] = response.data?.items || [];
        setDocuments((prev) => [...prev, ...newItems]);
        setOffset(documents.length + newItems.length);
      }
    } catch (err) {
      console.error("Error loading more documents:", err);
    } finally {
      setLoadingMore(false);
    }
  };

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
        {/* Subject Filter Pills - URL-synced */}
        <div className="relative mb-8 mt-4">
          <div className="flex items-center gap-2">
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Scrollable Subject Pills - Now using Links! */}
            <div
              ref={scrollContainerRef}
              className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <Link
                href={createBrowseURL({ type, lang, sort, search: null })}
                onClick={() => setSearchQuery("")}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  !subjectId
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                All Subjects
              </Link>
              {popularSubjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={createBrowseURL({ 
                    subject: subject.id, 
                    type, 
                    lang, 
                    sort, 
                    search: null
                  })}
                  onClick={() => setSearchQuery("")}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                    subjectId === subject.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {subject.displayName}
                </Link>
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
              onClick={() => updateFilter("type", "all")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                type === "all"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              All
              {type === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              <span className="ml-2 text-slate-400">
                {loading ? "..." : total.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => updateFilter("type", "book")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                type === "book"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Books
              {type === "book" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              <span className="ml-2 text-slate-400">
                {loading ? "..." : counts.books.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => updateFilter("type", "short_note")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                type === "short_note"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Short Notes
              {type === "short_note" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              <span className="ml-2 text-slate-400">
                {loading ? "..." : counts.shortNotes.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => updateFilter("type", "paper")}
              className={cn(
                "relative pb-4 text-sm font-medium transition-colors",
                type === "paper"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Papers
              {type === "paper" && (
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
            <Select value={lang} onValueChange={(v) => updateFilter("lang", v)}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-300 bg-white text-sm text-slate-900">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white">
                <SelectItem value="all" className="text-slate-900">All Languages</SelectItem>
                <SelectItem value="sinhala" className="text-slate-900">Sinhala</SelectItem>
                <SelectItem value="english" className="text-slate-900">English</SelectItem>
                <SelectItem value="tamil" className="text-slate-900">Tamil</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <Select value={sort} onValueChange={(v) => updateFilter("sort", v)}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-300 bg-white text-sm text-slate-900">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white">
                <SelectItem value="popular" className="text-slate-900">Popular</SelectItem>
                <SelectItem value="newest" className="text-slate-900">Newest</SelectItem>
                <SelectItem value="downloads" className="text-slate-900">Most Downloads</SelectItem>
                <SelectItem value="upvotes" className="text-slate-900">Most Upvotes</SelectItem>
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

        {/* Document Grid */}
        {!loading && !error && documents.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && documents.length === 0 && (
          <EmptyState
            type={subjectId ? "no-documents" : "no-results"}
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
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
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

// Loading skeleton for Suspense boundary
export function BrowseLoadingSkeleton() {
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
