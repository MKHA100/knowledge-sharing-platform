import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, DocumentWithUploader } from "@/types";

export async function GET() {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      users!uploader_id (
        name,
        avatar_url
      )
    `,
    )
    .gt("downvotes", 0)
    .eq("status", "approved")
    .order("downvotes", { ascending: false });

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  const documents = (data || []).map((doc: any) => ({
    ...doc,
    uploader_name: doc.users?.name || "Anonymous",
    uploader_avatar: doc.users?.avatar_url,
    downvote_ratio:
      doc.upvotes > 0
        ? ((doc.downvotes / (doc.upvotes + doc.downvotes)) * 100).toFixed(1)
        : 100,
  }));

  return NextResponse.json<ApiResponse<DocumentWithUploader[]>>({
    success: true,
    data: documents,
  });
}
