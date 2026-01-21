import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, User } from "@/types";

export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = createAdminClient();

  let query = supabase.from("users").select("*", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // Get stats for each user
  const usersWithStats = await Promise.all(
    (data || []).map(async (user: User) => {
      const [uploadCount, downloadCount, commentCount] = await Promise.all([
        supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("uploader_id", user.id),
        supabase
          .from("user_downloads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      return {
        ...user,
        upload_count: uploadCount.count || 0,
        download_count: downloadCount.count || 0,
        comment_count: commentCount.count || 0,
      };
    }),
  );

  return NextResponse.json<ApiResponse<{ users: User[]; total: number }>>({
    success: true,
    data: {
      users: usersWithStats,
      total: count || 0,
    },
  });
}
