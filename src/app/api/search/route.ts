import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchSchema } from "@/lib/validations/schemas";
import { findSubjectIdFromQuery, findMatchingSubjectIds } from "@/lib/constants/subjects";
import type { ApiResponse, SearchResult, PaginatedResponse } from "@/types";

/**
 * Search API - Uses the same smart search algorithm as documents API
 * Returns lightweight search results for autocomplete/suggestions
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const parseResult = searchSchema.safeParse({
    query: searchParams.get("query") || undefined,
    subject: searchParams.get("subject") || undefined,
    medium: searchParams.get("medium") || undefined,
    documentType: searchParams.get("documentType") || undefined,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 20,
    offset: searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0,
  });

  if (!parseResult.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Invalid parameters" },
      { status: 400 },
    );
  }

  const { query, subject, medium, documentType, limit, offset } =
    parseResult.data;

  const supabase = createAdminClient();

  // Smart search with subject matching
  const normalizedQuery = query?.toLowerCase().trim() || "";
  const matchingSubjectIds = normalizedQuery ? findMatchingSubjectIds(normalizedQuery) : [];
  const exactSubjectMatch = normalizedQuery ? findSubjectIdFromQuery(normalizedQuery) : null;

  // Build query
  let queryBuilder = supabase
    .from("documents")
    .select(
      "id, title, subject, medium, type, upvotes, downvotes, views, downloads, created_at",
    )
    .eq("status", "approved");

  // Apply filters
  if (subject) queryBuilder = queryBuilder.eq("subject", subject);
  if (medium) queryBuilder = queryBuilder.eq("medium", medium);
  if (documentType) queryBuilder = queryBuilder.eq("type", documentType);

  // Build OR conditions for search
  if (query) {
    const orConditions: string[] = [];
    
    // Title search
    orConditions.push(`title.ilike.%${query}%`);
    
    // Subject matching
    matchingSubjectIds.forEach(subjectId => {
      orConditions.push(`subject.eq.${subjectId}`);
    });
    
    queryBuilder = queryBuilder.or(orConditions.join(","));
  }

  const { data, error } = await queryBuilder
    .order("downloads", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // If no results and there was a query, log as failed search
  if ((!data || data.length === 0) && query) {
    // Log failed search asynchronously (don't wait) - wrapped in try-catch to prevent errors
    try {
      await supabase
        .from("failed_searches")
        .upsert(
          {
            query,
            normalized_query: query.toLowerCase().trim(),
            subject: subject || null,
            medium: medium || null,
            document_type: documentType || null,
            search_count: 1,
            last_searched_at: new Date().toISOString(),
          },
          {
            onConflict: "normalized_query",
            ignoreDuplicates: false,
          },
        );
    } catch (err) {
      // Ignore logging errors
      console.error("Failed to log search:", err);
    }
  }

  return NextResponse.json<
    ApiResponse<PaginatedResponse<SearchResult> & { suggestion?: string }>
  >({
    success: true,
    data: {
      items: data || [],
      total: data?.length || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: (data?.length || 0) === limit,
    },
  });
}
