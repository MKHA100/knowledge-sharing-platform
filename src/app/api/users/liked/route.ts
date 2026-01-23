import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, DocumentWithUploader } from "@/types";

export async function GET() {
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

  // Get liked (upvoted) documents
  const { data: likedDocs, error } = await supabase
    .from("document_votes")
    .select(`
      document_id,
      created_at,
      documents (
        id,
        title,
        type,
        subject,
        medium,
        file_path,
        downloads,
        views,
        upvotes,
        created_at,
        uploader_id,
        users!documents_uploader_id_fkey (
          name,
          avatar_url
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("vote_type", "upvote")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching liked documents:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch liked documents" },
      { status: 500 },
    );
  }

  // Transform the data
  const documents: DocumentWithUploader[] = (likedDocs || [])
    .filter((item: any) => item.documents)
    .map((item: any) => ({
      ...item.documents,
      uploader_name: item.documents.users?.name || "Anonymous",
      uploader_avatar: item.documents.users?.avatar_url || null,
      liked_at: item.created_at,
    }));

  return NextResponse.json<ApiResponse<DocumentWithUploader[]>>({
    success: true,
    data: documents,
  });
}
