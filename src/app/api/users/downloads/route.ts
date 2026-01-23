import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse, DocumentWithUploader } from "@/types";

export async function GET(request: NextRequest) {
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

  // Get user's downloaded documents
  const { data: downloads, error } = await supabase
    .from("user_downloads")
    .select(
      `
      *,
      documents (
        *,
        users!documents_uploader_id_fkey (
          name,
          avatar_url
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  const downloadedDocs: DocumentWithUploader[] = (downloads || [])
    .filter((d: any) => d.documents)
    .map((d: any) => ({
      ...d.documents,
      uploader_name: d.documents.users?.name || "Anonymous",
      uploader_avatar: d.documents.users?.avatar_url || null,
    }));

  return NextResponse.json<ApiResponse<DocumentWithUploader[]>>({
    success: true,
    data: downloadedDocs,
  });
}
