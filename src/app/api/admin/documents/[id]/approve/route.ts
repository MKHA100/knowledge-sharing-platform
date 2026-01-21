import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { moveFile } from "@/lib/r2/client";
import type { ApiResponse, Document } from "@/types";

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

  // Move file from pending to documents if needed
  let newFilePath = document.file_path;
  if (document.file_path.includes("/pending/")) {
    try {
      const oldKey = document.file_path.split("/").slice(-2).join("/");
      newFilePath = await moveFile(oldKey, "documents");
    } catch (error) {
      console.error("Failed to move file:", error);
    }
  }

  // Update document
  const { data: updated, error } = await supabase
    .from("documents")
    .update({
      status: "approved",
      file_path: newFilePath,
    })
    .eq("id", id)
    .select()
    .single();

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
      type: "upload_processed",
      title: "✅ Document Approved!",
      message: `Your "${document.title}" is now live and helping students!`,
      action_url: `/doc/${document.id}`,
    });
  }

  return NextResponse.json<ApiResponse<Document>>({
    success: true,
    data: updated,
    message: "Document approved",
  });
}
