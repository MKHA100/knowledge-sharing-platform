import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, Document, FailedSearch } from "@/types";

export async function POST(
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
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User not found" },
      { status: 404 },
    );
  }

  // Get the document first to have file_path
  const { data: docData } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!docData) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Document not found" },
      { status: 404 },
    );
  }

  // Increment download and record
  const { data: rpcResult, error } = await supabase.rpc("increment_download", {
    doc_id: id,
    downloader_id: user.id,
  });

  if (error) {
    // Fallback: Try to record download directly if RPC doesn't exist yet
    await supabase
      .from("user_downloads")
      .upsert(
        { user_id: user.id, document_id: id, is_unique: true },
        { onConflict: "user_id,document_id" },
      );

    // Increment download count
    await supabase
      .from("documents")
      .update({ downloads: (docData.downloads || 0) + 1 })
      .eq("id", id);
  }

  const document = rpcResult || docData;

  // Get a suggested query to show the downloader
  const { data: suggestion } = await supabase
    .rpc("get_suggested_query", {
      exclude_subject: document?.subject || null,
    })
    .catch(() => ({ data: null }));

  // Check if uploader should get notification (milestone: 10, 50, 100, etc.)
  const milestones = [10, 25, 50, 100, 250, 500, 1000];
  const downloadCount =
    rpcResult?.download_count || rpcResult?.downloads || docData.downloads + 1;

  if (document && milestones.includes(downloadCount)) {
    // Check notification limit
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", docData.uploader_id)
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );

    if ((count || 0) < 5 && docData.uploader_id) {
      await supabase.from("notifications").insert({
        user_id: docData.uploader_id,
        type: "download_milestone",
        title: "🎉 Milestone Reached!",
        message: `Your "${docData.title}" just hit ${downloadCount} downloads! You're helping so many students!`,
        link: `/doc/${docData.id}`,
      });
    }
  }

  return NextResponse.json<
    ApiResponse<{
      url: string;
      document: Document;
      suggestion: FailedSearch | null;
    }>
  >({
    success: true,
    data: {
      url: docData.file_path, // The R2 URL for downloading
      document: {
        ...docData,
        downloads: downloadCount,
      },
      suggestion: suggestion || null,
    },
  });
}
