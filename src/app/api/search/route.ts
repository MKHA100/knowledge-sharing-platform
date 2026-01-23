import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchSchema } from "@/lib/validations/schemas";
import { findSubjectIdFromQuery } from "@/lib/constants/subjects";
import type { ApiResponse, SearchResult, PaginatedResponse } from "@/types";

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

  // Check if query matches a subject name
  const matchedSubjectId = query ? findSubjectIdFromQuery(query) : null;

  // Try RPC search first with correct parameter names
  let data: any[] | null = null;
  let rpcError: any = null;

  try {
    const result = await supabase.rpc("search_documents", {
      search_query: query || "",
      filter_subject: subject || null,
      filter_medium: medium || null,
      filter_type: documentType || null,
      page_limit: limit,
      page_offset: offset,
    });

    data = result.data;
    rpcError = result.error;
  } catch (err) {
    console.error("RPC search_documents failed:", err);
    rpcError = err;
  }

  // Fallback to query builder if RPC fails
  if (rpcError) {
    let queryBuilder = supabase
      .from("documents")
      .select(
        "id, title, subject, medium, type, upvotes, downvotes, views, downloads, created_at",
      )
      .eq("status", "approved");

    if (query) {
      // Search in title
      queryBuilder = queryBuilder.ilike("title", `%${query}%`);
    }

    // If the query matches a subject, also include documents of that subject
    if (matchedSubjectId && !subject) {
      // This would need OR logic, so we'll just filter by subject if matched
      queryBuilder = supabase
        .from("documents")
        .select(
          "id, title, subject, medium, type, upvotes, downvotes, views, downloads, created_at",
        )
        .eq("status", "approved")
        .or(`title.ilike.%${query}%,subject.eq.${matchedSubjectId}`);
    }

    if (subject) queryBuilder = queryBuilder.eq("subject", subject);
    if (medium) queryBuilder = queryBuilder.eq("medium", medium);
    if (documentType) queryBuilder = queryBuilder.eq("type", documentType);

    queryBuilder = queryBuilder
      .order("downloads", { ascending: false })
      .range(offset, offset + limit - 1);

    const fallbackResult = await queryBuilder;

    if (fallbackResult.error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: fallbackResult.error.message },
        { status: 500 },
      );
    }

    data = fallbackResult.data;
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

  // Check for spell suggestions if no/few results
  let suggestion: string | null = null;
  if (query && (!data || data.length < 3)) {
    const { data: similarDocs } = await supabase
      .from("documents")
      .select("title")
      .eq("status", "approved")
      .limit(1)
      .order("title");

    // Simple suggestion logic - could be enhanced
    if (similarDocs && similarDocs.length > 0) {
      // This is placeholder - real implementation would use pg_trgm similarity
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
      suggestion: suggestion || undefined,
    },
  });
}
