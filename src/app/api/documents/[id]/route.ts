import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromR2 } from "@/lib/r2/client";
import type { ApiResponse, DocumentWithUploader } from "@/types";

// GET /api/documents/[id] - Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Document not found" },
      { status: 404 },
    );
  }

  const document: DocumentWithUploader = {
    ...data,
    uploader_name: data.users?.name || "Anonymous",
    uploader_avatar: data.users?.avatar_url || null,
  };

  return NextResponse.json<ApiResponse<DocumentWithUploader>>({
    success: true,
    data: document,
  });
}

// DELETE /api/documents/[id] - Delete document (owner or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  // Get user
  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User not found" },
      { status: 404 },
    );
  }

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

  // Check permission (owner or admin)
  if (document.uploader_id !== user.id && user.role !== "admin") {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Permission denied" },
      { status: 403 },
    );
  }

  // Delete from R2
  try {
    const fileKey = document.file_path.split("/").slice(-2).join("/");
    await deleteFromR2(fileKey);
  } catch (error) {
    console.error("R2 deletion failed:", error);
  }

  // Delete from database
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<null>>({
    success: true,
    message: "Document deleted successfully",
  });
}
