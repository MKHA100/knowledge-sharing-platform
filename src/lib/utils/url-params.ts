/**
 * URL Parameter Utilities
 * 
 * Centralized helpers for constructing and parsing URLs across the application.
 * Ensures consistent URL structure for SEO and shareable links.
 */

import { SUBJECTS, type SubjectId } from "@/lib/constants/subjects";

// ============================================================================
// SUBJECT SLUG MAPPING
// ============================================================================

/**
 * Bidirectional mapping between subject IDs and URL-safe slugs
 * Uses kebab-case for clean, SEO-friendly URLs
 */
export const SUBJECT_SLUG_MAP: Record<string, string> = {};
export const SLUG_TO_SUBJECT_MAP: Record<string, string> = {};

// Build the mappings from SUBJECTS array
SUBJECTS.forEach((subject) => {
  // Convert subject.id (snake_case) to kebab-case for URL
  const slug = subject.id.replace(/_/g, "-");
  SUBJECT_SLUG_MAP[subject.id] = slug;
  SLUG_TO_SUBJECT_MAP[slug] = subject.id;
});

/**
 * Convert a subject ID to a URL-safe slug
 * @example subjectIdToSlug("sinhala_language_literature") => "sinhala-language-literature"
 */
export function subjectIdToSlug(subjectId: string): string {
  return SUBJECT_SLUG_MAP[subjectId] || subjectId.replace(/_/g, "-");
}

/**
 * Convert a URL slug back to a subject ID
 * @example slugToSubjectId("sinhala-language-literature") => "sinhala_language_literature"
 */
export function slugToSubjectId(slug: string): string | null {
  return SLUG_TO_SUBJECT_MAP[slug] || null;
}

/**
 * Validate if a slug corresponds to a valid subject
 */
export function isValidSubjectSlug(slug: string): boolean {
  return slug in SLUG_TO_SUBJECT_MAP;
}

/**
 * Get all valid subject slugs (for generateStaticParams)
 */
export function getAllSubjectSlugs(): string[] {
  return Object.values(SUBJECT_SLUG_MAP);
}

// ============================================================================
// BROWSE URL CONSTRUCTION
// ============================================================================

export interface BrowseURLParams {
  subject?: string | null;
  type?: string | null;
  lang?: string | null;
  sort?: string | null;
  search?: string | null;
  doc?: string | null;
}

/**
 * Construct a browse page URL with optional filters
 * @example createBrowseURL({ subject: "mathematics", type: "paper" }) => "/browse/mathematics?type=paper"
 */
export function createBrowseURL(params: BrowseURLParams = {}): string {
  const { subject, type, lang, sort, search, doc } = params;
  
  // Base path - with or without subject
  let basePath = "/browse";
  if (subject && subject !== "all") {
    const slug = subjectIdToSlug(subject);
    basePath = `/browse/${slug}`;
  }
  
  // Build query string for filters
  const queryParams = new URLSearchParams();
  
  if (type && type !== "all") {
    queryParams.set("type", type);
  }
  if (lang && lang !== "all") {
    queryParams.set("lang", lang);
  }
  if (sort && sort !== "popular") {
    queryParams.set("sort", sort);
  }
  if (search) {
    queryParams.set("q", search);
  }
  if (doc) {
    queryParams.set("doc", doc);
  }
  
  const queryString = queryParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Parse browse URL search params into a standardized object
 */
export function parseBrowseParams(searchParams: URLSearchParams): {
  type: string;
  lang: string;
  sort: string;
  search: string;
  doc: string | null;
} {
  const typeParam = searchParams.get("type") || "all";
  // Map legacy 'note' to 'short_note'
  const type = typeParam === "note" ? "short_note" : typeParam;
  
  return {
    type,
    lang: searchParams.get("lang") || searchParams.get("medium") || "all",
    sort: searchParams.get("sort") || "popular",
    search: searchParams.get("q") || "",
    doc: searchParams.get("doc"),
  };
}

// ============================================================================
// DASHBOARD URL CONSTRUCTION
// ============================================================================

export type DashboardTab = "uploads" | "downloads" | "liked" | "notifications" | "account";

export const VALID_DASHBOARD_TABS: DashboardTab[] = [
  "uploads",
  "downloads", 
  "liked",
  "notifications",
  "account",
];

/**
 * Validate if a tab name is valid
 */
export function isValidDashboardTab(tab: string): tab is DashboardTab {
  return VALID_DASHBOARD_TABS.includes(tab as DashboardTab);
}

/**
 * Construct a dashboard URL for a specific tab
 * @example createDashboardURL("notifications", "unread") => "/dashboard/notifications?filter=unread"
 */
export function createDashboardURL(tab: DashboardTab, filter?: string): string {
  let url = `/dashboard/${tab}`;
  if (filter && filter !== "all") {
    url += `?filter=${filter}`;
  }
  return url;
}

// ============================================================================
// ADMIN URL CONSTRUCTION
// ============================================================================

export type AdminSection = 
  | "overview"
  | "pending-review"
  | "pending-images"
  | "documents"
  | "users"
  | "downvoted"
  | "thank-you"
  | "recommendations"
  | "complements"
  | "settings";

export const VALID_ADMIN_SECTIONS: AdminSection[] = [
  "overview",
  "pending-review",
  "pending-images",
  "documents",
  "users",
  "downvoted",
  "thank-you",
  "recommendations",
  "complements",
  "settings",
];

/**
 * Validate if a section name is valid
 */
export function isValidAdminSection(section: string): section is AdminSection {
  return VALID_ADMIN_SECTIONS.includes(section as AdminSection);
}

/**
 * Construct an admin URL for a specific section
 * @example createAdminURL("pending-review") => "/admin/pending-review"
 */
export function createAdminURL(section: AdminSection): string {
  return `/admin/${section}`;
}

// ============================================================================
// UPLOAD URL CONSTRUCTION
// ============================================================================

export type UploadType = "book" | "short-note" | "paper" | "jumbled";

export const VALID_UPLOAD_TYPES: UploadType[] = [
  "book",
  "short-note",
  "paper",
  "jumbled",
];

/**
 * Validate if an upload type is valid
 */
export function isValidUploadType(type: string): type is UploadType {
  return VALID_UPLOAD_TYPES.includes(type as UploadType);
}

/**
 * Convert upload type slug to API format
 * @example uploadTypeSlugToApiFormat("short-note") => "short_note"
 */
export function uploadTypeSlugToApiFormat(slug: string): string {
  return slug.replace(/-/g, "_");
}

/**
 * Convert API format to upload type slug
 * @example uploadTypeApiFormatToSlug("short_note") => "short-note"
 */
export function uploadTypeApiFormatToSlug(apiFormat: string): string {
  return apiFormat.replace(/_/g, "-");
}

/**
 * Construct an upload URL
 * @example createUploadURL("book", "details") => "/upload/book/details"
 */
export function createUploadURL(type?: UploadType, step?: "details"): string {
  if (!type) return "/upload";
  if (step === "details") return `/upload/${type}/details`;
  return `/upload/${type}`;
}
