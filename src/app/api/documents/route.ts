import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchSchema } from "@/lib/validations/schemas";
import { 
  findSubjectIdFromQuery, 
  findMatchingSubjectIds,
  SUBJECTS,
} from "@/lib/constants/subjects";
import type {
  ApiResponse,
  DocumentWithUploader,
  PaginatedResponse,
} from "@/types";

/**
 * Smart Search Algorithm for Educational Documents
 * 
 * This search is designed specifically for O-Level students looking for study materials.
 * It uses a multi-layered approach:
 * 
 * 1. SUBJECT MATCHING: If query matches a subject name/alias, include ALL docs from that subject
 * 2. TITLE SEARCH: Fuzzy match against document titles using PostgreSQL pg_trgm
 * 3. DESCRIPTION SEARCH: Check document descriptions for matches
 * 4. COMBINED SCORING: Rank by relevance (exact subject match > title match > fuzzy match)
 * 
 * Special cases:
 * - "literature" → matches all 4 literature subjects (English, Sinhala, Tamil, Arabic)
 * - "maths" → matches "mathematics"
 * - Subject aliases (e.g., "ICT" → "Information & Communication Technology")
 */

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

  // Use smart search when query is provided
  if (query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Find ALL matching subject IDs (not just exact match)
    // This handles "literature" → [english_literary_texts, sinhala_literary_texts, ...]
    // And "english" → [english, english_literary_texts]
    const matchingSubjectIds = findMatchingSubjectIds(normalizedQuery);
    
    // Also find exact subject match for prioritization
    const exactSubjectMatch = findSubjectIdFromQuery(normalizedQuery);
    
    // Build a comprehensive search query
    // Strategy: Fetch ALL documents, then filter and score in application layer
    // This is more flexible than pure SQL for complex multi-factor search
    
    let queryBuilder = supabase
      .from("documents")
      .select(
        `
        *,
        users!uploader_id (
          name,
          avatar_url,
          anon_name,
          anon_avatar_seed
        )
      `,
        { count: "exact" },
      )
      .eq("status", "approved");

    // Apply additional filters if specified
    if (subject) queryBuilder = queryBuilder.eq("subject", subject);
    if (medium) queryBuilder = queryBuilder.eq("medium", medium);
    if (documentType) queryBuilder = queryBuilder.eq("type", documentType);

    // Build OR conditions for comprehensive search
    const orConditions: string[] = [];
    
    // 1. Title contains query (case-insensitive)
    orConditions.push(`title.ilike.%${query}%`);
    
    // 2. Description contains query (if we have descriptions)
    orConditions.push(`description.ilike.%${query}%`);
    
    // 3. Match any related subject IDs
    if (matchingSubjectIds.length > 0) {
      // For each matching subject, add it to OR conditions
      matchingSubjectIds.forEach(subjectId => {
        orConditions.push(`subject.eq.${subjectId}`);
      });
    }
    
    // Apply the OR conditions
    queryBuilder = queryBuilder.or(orConditions.join(","));

    // Fetch documents
    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error("Search query failed:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Score and sort results for relevance
    const scoredDocs = (data || []).map((doc: any) => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const descLower = (doc.description || "").toLowerCase();
      
      // Scoring factors:
      
      // 1. Exact subject match (highest priority for subject searches)
      if (exactSubjectMatch && doc.subject === exactSubjectMatch) {
        score += 100;
      }
      
      // 2. Related subject match (e.g., "literature" matches english_literary_texts)
      if (matchingSubjectIds.includes(doc.subject)) {
        score += 80;
      }
      
      // 3. Title contains exact query
      if (titleLower.includes(normalizedQuery)) {
        score += 60;
        // Bonus if query is at the start of title
        if (titleLower.startsWith(normalizedQuery)) {
          score += 20;
        }
      }
      
      // 4. Title word match (partial words)
      const queryWords = normalizedQuery.split(/\s+/);
      const titleWords = titleLower.split(/\s+/);
      const matchingWords = queryWords.filter((qw: string) => 
        titleWords.some((tw: string) => tw.includes(qw) || qw.includes(tw))
      );
      score += matchingWords.length * 15;
      
      // 5. Description match
      if (descLower.includes(normalizedQuery)) {
        score += 30;
      }
      
      // 6. Popularity bonus (downloads + views)
      score += Math.min((doc.downloads || 0) + (doc.views || 0) * 0.1, 20);
      
      // 7. Upvote bonus
      score += Math.min((doc.upvotes || 0) * 2, 10);
      
      return { ...doc, _searchScore: score };
    });

    // Sort by score (highest first), then by downloads as tiebreaker
    scoredDocs.sort((a, b) => {
      if (b._searchScore !== a._searchScore) {
        return b._searchScore - a._searchScore;
      }
      return (b.downloads || 0) - (a.downloads || 0);
    });

    // Apply pagination after scoring
    const paginatedDocs = scoredDocs.slice(offset, offset + limit);

    // Transform to final format with anonymous user data
    const documents: DocumentWithUploader[] = paginatedDocs.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      uploader_id: doc.uploader_id,
      uploader_name: doc.users?.anon_name || "Anonymous",
      uploader_avatar: doc.users?.anon_avatar_seed 
        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.users.anon_avatar_seed}`
        : null,
      subject: doc.subject,
      medium: doc.medium,
      type: doc.type,
      upvotes: doc.upvotes,
      downvotes: doc.downvotes,
      views: doc.views,
      downloads: doc.downloads,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      file_path: doc.file_path || "",
      file_size: doc.file_size || 0,
      page_count: doc.page_count || null,
      thumbnail_url: doc.thumbnail_url || null,
      status: doc.status,
      rejection_reason: doc.rejection_reason || null,
      is_featured: doc.is_featured || false,
      is_trending: doc.is_trending || false,
    }));

    return NextResponse.json<
      ApiResponse<PaginatedResponse<DocumentWithUploader>>
    >({
      success: true,
      data: {
        items: documents,
        total: scoredDocs.length,
        page: Math.floor(offset / limit) + 1,
        limit,
        hasMore: offset + limit < scoredDocs.length,
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
        avatar_url,
        anon_name,
        anon_avatar_seed
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

  // Transform data to include anonymous uploader info
  const documents: DocumentWithUploader[] = (data || []).map((doc: any) => ({
    ...doc,
    uploader_name: doc.users?.anon_name || "Anonymous",
    uploader_avatar: doc.users?.anon_avatar_seed 
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.users.anon_avatar_seed}`
      : null,
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
