import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromR2 } from "@/lib/r2/client";
import type { ApiResponse } from "@/types";

export async function POST(
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

  const body = await request.json();
  const reason = body.reason || "Does not meet quality standards";

  const supabase = createAdminClient();

  // Get document
  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!document) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Document not found" },
      { status: 404 },
    );
  }

  // Delete file from R2
  try {
    const fileKey = document.file_path.split("/").slice(-2).join("/");
    await deleteFromR2(fileKey);
  } catch (error) {
    console.error("Failed to delete file:", error);
  }

  // Update document status
  const { error } = await supabase
    .from("documents")
    .update({
      status: "rejected",
      rejection_reason: reason,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // Notify uploader
  if (document.uploader_id) {
    await supabase.from("notifications").insert({
      user_id: document.uploader_id,
      type: "document_rejected",
      title: "Upload Update",
      message: `We really appreciate your effort to share "${document.title}"! Unfortunately, this document was already uploaded by another student. Keep sharing - you're amazing! 💪`,
    });
  }

  return NextResponse.json<ApiResponse<null>>({
    success: true,
    message: "Document rejected",
  });
}
