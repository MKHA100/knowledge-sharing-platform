import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToR2 } from "@/lib/r2/client";
import { generateThumbnailFromURL } from "@/lib/utils/thumbnail-generator";
import type { ApiResponse } from "@/types";

/**
 * Admin endpoint to generate thumbnails for existing documents
 * Processes documents in batches to avoid timeouts
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  // Check if user is admin
  const { data: user } = await supabase
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

  try {
    const body = await request.json();
    const batchSize = body.batchSize || 10;
    const limit = body.limit || 100; // Total documents to process

    // Get documents without thumbnails
    const { data: documents, error: fetchError } = await supabase
      .from("documents")
      .select("id, title, file_path")
      .is("thumbnail_url", null)
      .eq("status", "approved")
      .limit(limit);

    if (fetchError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: fetchError.message },
        { status: 500 },
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json<
        ApiResponse<{ processed: number; failed: number; total: number }>
      >({
        success: true,
        data: { processed: 0, failed: 0, total: 0 },
        message: "No documents need thumbnail generation",
      });
    }

    let processedCount = 0;
    let failedCount = 0;
    const failedDocuments: Array<{ id: string; title: string; error: string }> =
      [];

    // Process in batches
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (doc) => {
          try {
            // Generate thumbnail from PDF URL
            const thumbnailBuffer = await generateThumbnailFromURL(
              doc.file_path,
              600,
              85,
            );

            // Upload thumbnail to R2
            const thumbnailFileName = `${doc.id}_thumb.jpg`;
            const thumbnailUpload = await uploadToR2(
              thumbnailBuffer,
              thumbnailFileName,
              "image/jpeg",
              "thumbnails",
            );

            // Update document with thumbnail URL
            const { error: updateError } = await supabase
              .from("documents")
              .update({ thumbnail_url: thumbnailUpload.url })
              .eq("id", doc.id);

            if (updateError) {
              throw new Error(updateError.message);
            }

            processedCount++;
            console.log(
              `✅ Generated thumbnail for: ${doc.title} (${processedCount}/${documents.length})`,
            );
          } catch (error) {
            failedCount++;
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            failedDocuments.push({
              id: doc.id,
              title: doc.title,
              error: errorMessage,
            });
            console.error(`❌ Failed to generate thumbnail for ${doc.title}:`, error);
          }
        }),
      );

      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < documents.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json<
      ApiResponse<{
        processed: number;
        failed: number;
        total: number;
        failedDocuments: Array<{ id: string; title: string; error: string }>;
      }>
    >({
      success: true,
      data: {
        processed: processedCount,
        failed: failedCount,
        total: documents.length,
        failedDocuments,
      },
      message: `Processed ${processedCount}/${documents.length} documents. ${failedCount} failed.`,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Backfill process failed",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check backfill status
 * Returns count of documents with and without thumbnails
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  // Check if user is admin
  const { data: user } = await supabase
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

  try {
    // Count documents with thumbnails
    const { count: withThumbnails } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .not("thumbnail_url", "is", null)
      .eq("status", "approved");

    // Count documents without thumbnails
    const { count: withoutThumbnails } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .is("thumbnail_url", null)
      .eq("status", "approved");

    return NextResponse.json<
      ApiResponse<{
        withThumbnails: number;
        withoutThumbnails: number;
        total: number;
      }>
    >({
      success: true,
      data: {
        withThumbnails: withThumbnails || 0,
        withoutThumbnails: withoutThumbnails || 0,
        total: (withThumbnails || 0) + (withoutThumbnails || 0),
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to check status" },
      { status: 500 },
    );
  }
}
