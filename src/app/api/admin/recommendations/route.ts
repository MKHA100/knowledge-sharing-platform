import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/types";

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface Recommendation {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "pending" | "reviewed" | "implemented" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    name: string;
  };
}

interface RecommendationsResponse {
  items: Recommendation[];
  total: number;
}

/**
 * GET /api/admin/recommendations
 * List all recommendations (admin only)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build query
    let query = supabaseAdmin
      .from("recommendations")
      .select(`
        id,
        name,
        email,
        message,
        status,
        admin_notes,
        reviewed_at,
        created_at,
        reviewed_by
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching recommendations:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to fetch recommendations" },
        { status: 500 }
      );
    }

    // Fetch reviewer details if needed
    const reviewerIds = data
      ?.filter(r => r.reviewed_by)
      .map(r => r.reviewed_by) || [];

    let reviewers: Record<string, { id: string; name: string }> = {};
    if (reviewerIds.length > 0) {
      const { data: reviewerData } = await supabaseAdmin
        .from("users")
        .select("id, name")
        .in("id", reviewerIds);

      if (reviewerData) {
        reviewers = Object.fromEntries(
          reviewerData.map(r => [r.id, { id: r.id, name: r.name }])
        );
      }
    }

    const items: Recommendation[] = (data || []).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      message: r.message,
      status: r.status,
      admin_notes: r.admin_notes,
      reviewed_at: r.reviewed_at,
      created_at: r.created_at,
      reviewer: r.reviewed_by ? reviewers[r.reviewed_by] : undefined,
    }));

    return NextResponse.json<ApiResponse<RecommendationsResponse>>({
      success: true,
      data: {
        items,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
