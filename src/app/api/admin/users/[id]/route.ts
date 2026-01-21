import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, UserDetails } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const supabase = createAdminClient();

  // Get user
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User not found" },
      { status: 404 },
    );
  }

  // Get all user data
  const [uploads, downloads, commentsSent, commentsReceived] =
    await Promise.all([
      supabase
        .from("documents")
        .select("*")
        .eq("uploader_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_downloads")
        .select(
          `
        *,
        documents (*)
      `,
        )
        .eq("user_id", id)
        .order("downloaded_at", { ascending: false }),
      supabase
        .from("comments")
        .select(
          `
        *,
        documents (id, title)
      `,
        )
        .eq("sender_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("comments")
        .select(
          `
        *,
        users!sender_id (name),
        documents (id, title)
      `,
        )
        .in(
          "document_id",
          (
            await supabase.from("documents").select("id").eq("uploader_id", id)
          ).data?.map((d: { id: string }) => d.id) || [],
        )
        .order("created_at", { ascending: false }),
    ]);

  const userDetails: UserDetails = {
    ...user,
    uploadCount: uploads.data?.length || 0,
    downloadCount: downloads.data?.length || 0,
    commentsSent: commentsSent.data?.length || 0,
    commentsReceived: commentsReceived.data?.length || 0,
    uploads: uploads.data || [],
    downloads: downloads.data?.map((d: any) => d.documents) || [],
  };

  return NextResponse.json<
    ApiResponse<
      UserDetails & {
        commentsSentDetails: any[];
        commentsReceivedDetails: any[];
      }
    >
  >({
    success: true,
    data: {
      ...userDetails,
      commentsSentDetails: commentsSent.data || [],
      commentsReceivedDetails: commentsReceived.data || [],
    },
  });
}
