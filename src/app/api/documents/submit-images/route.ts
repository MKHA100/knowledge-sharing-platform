import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { ApiResponse } from "@/types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createAdminClient } from "@/lib/supabase/admin";

// R2 client for image uploads
const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
});

/**
 * POST /api/documents/submit-images
 * Handles image uploads that go to admin for review
 * Uploads images to R2 and creates pending_images record
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    // Verify all files are images
    const isImageFile = (type: string) => type.startsWith("image/");
    const allImages = files.every((file) => isImageFile(file.type));
    if (!allImages) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "All files must be images for this endpoint" },
        { status: 400 },
      );
    }

    // Get user from database
    const adminClient = createAdminClient();
    const { data: user } = await adminClient
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

    // Upload images to R2
    const timestamp = Date.now();
    const filePaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.split(".").pop() || "jpg";
      const r2Key = `pending-images/${user.id}/${timestamp}-${i}.${extension}`;

      try {
        await R2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: r2Key,
            Body: buffer,
            ContentType: file.type,
          })
        );
        filePaths.push(r2Key);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with other files
      }
    }

    if (filePaths.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to upload images" },
        { status: 500 },
      );
    }

    // Create pending_images record
    const { data: insertData, error: dbError } = await adminClient
      .from("pending_images")
      .insert({
        uploader_id: user.id,
        file_paths: filePaths,
        status: "pending",
      })
      .select();

    if (dbError) {
      console.error("Failed to create pending_images record:", dbError);
      console.error("Database error details:", {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      });
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Failed to save submission: ${dbError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json<
      ApiResponse<{ message: string; fileCount: number; status: string }>
    >({
      success: true,
      data: {
        message: `${filePaths.length} image(s) submitted for admin review`,
        fileCount: filePaths.length,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Image submission error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to submit images" },
      { status: 500 },
    );
  }
}
