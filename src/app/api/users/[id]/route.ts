import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, User, Document } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Get user
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, created_at")
    .eq("id", id)
    .single();

  if (error || !user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User not found" },
      { status: 404 },
    );
  }

  // Get user's approved uploads
  const { data: uploads } = await supabase
    .from("documents")
    .select("*")
    .eq("uploader_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  // Get upload stats
  const totalDownloads =
    uploads?.reduce(
      (sum: number, doc: { downloads: number }) => sum + doc.downloads,
      0,
    ) || 0;

  return NextResponse.json<
    ApiResponse<{
      user: Partial<User>;
      uploads: Document[];
      stats: { totalUploads: number; totalDownloads: number };
    }>
  >({
    success: true,
    data: {
      user,
      uploads: uploads || [],
      stats: {
        totalUploads: uploads?.length || 0,
        totalDownloads,
      },
    },
  });
}
