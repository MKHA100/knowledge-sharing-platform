import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchSchema } from "@/lib/validations/schemas";
import { 
  findSubjectIdFromQuery, 
  isLiteratureQuery, 
  findLiteratureSubjectIds 
} from "@/lib/constants/subjects";
import type {
  ApiResponse,
  DocumentWithUploader,
  PaginatedResponse,
} from "@/types";

// GET /api/documents - List documents with filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const parseResult = searchSchema.safeParse({
    query: searchParams.get("query") || undefined,
    subject: searchParams.get("subject") || undefined,
    medium: searchParams.get("medium") || undefined,
    documentType: searchParams.get("documentType") || undefined,
    sortBy: searchParams.get("sortBy") || undefined,
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

  const { query, subject, medium, documentType, sortBy, limit, offset } =
    parseResult.data;

  const supabase = createAdminClient();

  // Use search when query is provided
  if (query) {
    // Check if this is a literature search
    const isLitSearch = isLiteratureQuery(query);
    const literatureSubjectIds = isLitSearch ? findLiteratureSubjectIds() : [];
    
    // First, try to find if the query matches a subject name
    const matchedSubjectId = findSubjectIdFromQuery(query);

    // Try RPC search first
    try {
      const { data, error } = await supabase.rpc("search_documents", {
        search_query: query,
        filter_subject: subject || null,
        filter_medium: medium || null,
        filter_type: documentType || null,
        page_limit: limit,
        page_offset: offset,
      });

      if (!error && data) {
        // Transform to include file_path for DocumentWithUploader compatibility
        let items: DocumentWithUploader[] = (data || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          uploader_name: doc.uploader_name || "Anonymous",
          uploader_avatar: null,
          subject: doc.subject,
          medium: doc.medium,
          type: doc.type,
          upvotes: doc.upvotes,
          downvotes: doc.downvotes,
          views: doc.views,
          downloads: doc.downloads,
          created_at: doc.created_at,
          file_path: "",
          status: "approved",
        }));
        
        // If literature search, filter to only include literature subjects
        if (isLitSearch) {
          items = items.filter((doc) => literatureSubjectIds.includes(doc.subject));
        }

        return NextResponse.json<
          ApiResponse<PaginatedResponse<DocumentWithUploader>>
        >({
          success: true,
          data: {
            items,
            total: items.length,
            page: Math.floor(offset / limit) + 1,
            limit,
            hasMore: items.length === limit,
          },
        });
      }
    } catch (rpcError) {
      console.error("RPC search_documents failed, using fallback:", rpcError);
    }

    // Fallback: Use query builder with ILIKE search
    let queryBuilder = supabase
      .from("documents")
      .select(
        `
        *,
        users!uploader_id (
          name,
          avatar_url
        )
      `,
        { count: "exact" },
      )
      .eq("status", "approved");

    // For literature search, filter by literature subjects
    if (isLitSearch && literatureSubjectIds.length > 0) {
      queryBuilder = queryBuilder.in("subject", literatureSubjectIds);
    } else {
      // Search in title with ILIKE
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%`);

      // If query matches a subject, also filter by that subject
      if (matchedSubjectId) {
        queryBuilder = queryBuilder.or(`subject.eq.${matchedSubjectId}`);
      }
    }

    if (subject) queryBuilder = queryBuilder.eq("subject", subject);
    if (medium) queryBuilder = queryBuilder.eq("medium", medium);
    if (documentType) queryBuilder = queryBuilder.eq("type", documentType);

    queryBuilder = queryBuilder
      .order("downloads", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const documents: DocumentWithUploader[] = (data || []).map((doc: any) => ({
      ...doc,
      uploader_name: doc.users?.name || "Anonymous",
      uploader_avatar: doc.users?.avatar_url || null,
      users: undefined,
    }));

    return NextResponse.json<
      ApiResponse<PaginatedResponse<DocumentWithUploader>>
    >({
      success: true,
      data: {
        items: documents,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        hasMore: offset + limit < (count || 0),
      },
    });
  }

  // Regular query without search
  let queryBuilder = supabase
    .from("documents")
    .select(
      `
      *,
      users!uploader_id (
        name,
        avatar_url
      )
    `,
      { count: "exact" },
    )
    .eq("status", "approved");

  if (subject) queryBuilder = queryBuilder.eq("subject", subject);
  if (medium) queryBuilder = queryBuilder.eq("medium", medium);
  if (documentType) queryBuilder = queryBuilder.eq("type", documentType);

  // Sorting
  switch (sortBy) {
    case "popular":
    case "downloads":
      queryBuilder = queryBuilder.order("downloads", { ascending: false });
      break;
    case "upvotes":
      queryBuilder = queryBuilder.order("upvotes", { ascending: false });
      break;
    case "newest":
    default:
      queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }

  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // Transform data to include uploader info
  const documents: DocumentWithUploader[] = (data || []).map((doc: any) => ({
    ...doc,
    uploader_name: doc.users?.name || "Anonymous",
    uploader_avatar: doc.users?.avatar_url || null,
    users: undefined,
  }));

  return NextResponse.json<
    ApiResponse<PaginatedResponse<DocumentWithUploader>>
  >({
    success: true,
    data: {
      items: documents,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + limit < (count || 0),
    },
  });
}
