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

  // Get saved documents - simplified query
  const { data: savedDocs, error } = await supabase
    .from("user_saved")
    .select("document_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved documents:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: `Failed to fetch saved documents: ${error.message}` },
      { status: 500 },
    );
  }

  // If no saved documents, return empty array
  if (!savedDocs || savedDocs.length === 0) {
    return NextResponse.json<ApiResponse<DocumentWithUploader[]>>({
      success: true,
      data: [],
    });
  }

  // Fetch document details separately
  const documentIds = savedDocs.map((s: any) => s.document_id);
  
  const { data: documents, error: docsError } = await supabase
    .from("documents")
    .select(`
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
    `)
    .in("id", documentIds);

  if (docsError) {
    console.error("Error fetching document details:", docsError);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch document details" },
      { status: 500 },
    );
  }

  // Merge saved dates with document data
  const documentsWithSaveDate: DocumentWithUploader[] = (documents || []).map((doc: any) => {
    const savedEntry = savedDocs.find((s: any) => s.document_id === doc.id);
    return {
      ...doc,
      uploader_name: doc.users?.name || "Anonymous",
      uploader_avatar: doc.users?.avatar_url || null,
      saved_at: savedEntry?.created_at,
    };
  });

  return NextResponse.json<ApiResponse<DocumentWithUploader[]>>({
    success: true,
    data: documentsWithSaveDate,
  });
}
