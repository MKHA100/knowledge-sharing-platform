import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/types";

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export interface PendingImageBatch {
  id: string;
  uploader_id: string;
  uploader_name: string;
  uploader_email: string;
  file_paths: string[];
  image_count: number;
  status: string;
  created_at: string;
}

/**
 * GET /api/admin/pending-images
 * Fetches all pending image submissions for admin review
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    // Fetch pending image batches with uploader info
    const { data: pendingImages, error } = await supabaseAdmin
      .from("pending_images")
      .select(`
        id,
        uploader_id,
        file_paths,
        status,
        created_at,
        users:uploader_id (
          name,
          email
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending images:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to fetch pending images" },
        { status: 500 },
      );
    }

    // Format the response
    const formattedData: PendingImageBatch[] = (pendingImages || []).map((batch: any) => ({
      id: batch.id,
      uploader_id: batch.uploader_id,
      uploader_name: batch.users?.name || "Unknown",
      uploader_email: batch.users?.email || "",
      file_paths: batch.file_paths || [],
      image_count: (batch.file_paths || []).length,
      status: batch.status,
      created_at: batch.created_at,
    }));

    return NextResponse.json<ApiResponse<PendingImageBatch[]>>({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in pending images API:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
