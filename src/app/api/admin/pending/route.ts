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
        id,
        name,
        avatar_url,
        email
      )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // Get upload counts for each uploader
  const documentsWithContext = await Promise.all(
    (data || []).map(async (doc: any) => {
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("uploader_id", doc.uploader_id);

      return {
        ...doc,
        uploader_name: doc.users?.name || "Anonymous",
        uploader_avatar: doc.users?.avatar_url,
        uploader_email: doc.users?.email,
        uploader_total_uploads: count || 0,
      };
    }),
  );

  return NextResponse.json<ApiResponse<DocumentWithUploader[]>>({
    success: true,
    data: documentsWithContext,
  });
}
