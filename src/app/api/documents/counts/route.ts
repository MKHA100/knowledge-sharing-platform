import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types";

export interface DocumentCounts {
  total: number;
  books: number;
  shortNotes: number;
  papers: number;
}

/**
 * GET /api/documents/counts
 * Returns counts of documents by type, with optional filters
 * This is more efficient than fetching all documents just to count them
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subject = searchParams.get("subject") || undefined;
  const medium = searchParams.get("medium") || undefined;
  const query = searchParams.get("query") || undefined;

  const supabase = createAdminClient();

  try {
    // Build base query conditions
    const baseConditions: Record<string, string> = { status: "approved" };
    if (subject && subject !== "all") baseConditions.subject = subject;
    if (medium && medium !== "all") baseConditions.medium = medium;

    // If there's a search query, we need to use ilike conditions
    if (query) {
      // For search queries, we need to count matches differently
      let queryBuilder = supabase
        .from("documents")
        .select("type", { count: "exact" })
        .eq("status", "approved");

      if (subject && subject !== "all") queryBuilder = queryBuilder.eq("subject", subject);
      if (medium && medium !== "all") queryBuilder = queryBuilder.eq("medium", medium);
      
      // Add search condition
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      const { data, error } = await queryBuilder;

      if (error) {
        console.error("Counts query error:", error);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // Count by type
      const counts: DocumentCounts = {
        total: data?.length || 0,
        books: data?.filter((d: { type: string }) => d.type === "book").length || 0,
        shortNotes: data?.filter((d: { type: string }) => d.type === "short_note").length || 0,
        papers: data?.filter((d: { type: string }) => d.type === "paper").length || 0,
      };

      return NextResponse.json<ApiResponse<DocumentCounts>>({
        success: true,
        data: counts,
      });
    }

    // Without search query, use efficient count queries
    const [totalResult, booksResult, shortNotesResult, papersResult] = await Promise.all([
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .match(baseConditions),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .match({ ...baseConditions, type: "book" }),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .match({ ...baseConditions, type: "short_note" }),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .match({ ...baseConditions, type: "paper" }),
    ]);

    if (totalResult.error || booksResult.error || shortNotesResult.error || papersResult.error) {
      const error = totalResult.error || booksResult.error || shortNotesResult.error || papersResult.error;
      console.error("Counts query error:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error?.message || "Failed to fetch counts" },
        { status: 500 }
      );
    }

    const counts: DocumentCounts = {
      total: totalResult.count || 0,
      books: booksResult.count || 0,
      shortNotes: shortNotesResult.count || 0,
      papers: papersResult.count || 0,
    };

    return NextResponse.json<ApiResponse<DocumentCounts>>({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error("Counts API error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch document counts" },
      { status: 500 }
    );
  }
}
