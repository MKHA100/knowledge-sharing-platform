import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, AdminStats } from "@/types";

export async function GET() {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const supabase = createAdminClient();

  // Get all stats in parallel
  const [
    { count: totalDocuments },
    { count: totalUsers },
    { count: pendingReview },
    { count: downvotedDocuments },
    { data: downloadStats },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .gt("downvotes", 0),
    supabase.from("documents").select("downloads").eq("status", "approved"),
  ]);

  const totalDownloads =
    downloadStats?.reduce(
      (sum: number, doc: { downloads: number }) => sum + doc.downloads,
      0,
    ) || 0;

  return NextResponse.json<ApiResponse<AdminStats>>({
    success: true,
    data: {
      totalDocuments: totalDocuments || 0,
      totalUsers: totalUsers || 0,
      totalDownloads,
      pendingReview: pendingReview || 0,
      downvotedDocuments: downvotedDocuments || 0,
    },
  });
}
