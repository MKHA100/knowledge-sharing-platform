import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Get the pending images batch
    const { data: batch, error: batchError } = await supabase
      .from("pending_images")
      .select("*")
      .eq("id", id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Delete all images from R2
    const deletePromises = batch.file_paths.map(async (filePath: string) => {
      try {
        await R2.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: filePath,
          })
        );
      } catch (error) {
        console.error(`Failed to delete ${filePath}:`, error);
        // Continue even if delete fails
      }
    });

    await Promise.allSettled(deletePromises);

    // Update batch status to processed
    const { error: updateError } = await supabase
      .from("pending_images")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        processed_by: userId,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update batch status:", updateError);
      return NextResponse.json(
        { error: "Failed to update batch status" },
        { status: 500 }
      );
    }

    // TODO: Send notification to uploader (optional)
    // const { data: uploaderData } = await supabase
    //   .from("users")
    //   .select("clerk_id")
    //   .eq("id", batch.uploader_id)
    //   .single();
    //
    // if (uploaderData) {
    //   await supabase.from("notifications").insert({
    //     user_id: uploaderData.clerk_id,
    //     type: "images_processed",
    //     message: "Your image submission has been processed",
    //   });
    // }

    return NextResponse.json({
      success: true,
      message: "Batch marked as processed and images deleted",
    });
  } catch (error) {
    console.error("Process batch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
