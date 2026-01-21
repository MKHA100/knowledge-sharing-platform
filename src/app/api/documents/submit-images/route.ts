import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { ApiResponse } from "@/types";
import { convertImagesToPdf, isImageFile } from "@/lib/utils/pdf-converter";

/**
 * POST /api/documents/submit-images
 * Handles image-only uploads that go directly to admin for review
 * Converts images to PDF and marks as pending admin approval
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
    const allImages = files.every((file) => isImageFile(file.type));
    if (!allImages) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "All files must be images for this endpoint" },
        { status: 400 },
      );
    }

    // Convert all images to buffers
    const imageBuffers = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
      })),
    );

    // Convert images to a single PDF
    const pdfBuffer = await convertImagesToPdf(imageBuffers);

    // TODO: Upload PDF to R2 pending folder
    // const r2Key = `pending/${userId}/${Date.now()}.pdf`;
    // await uploadToR2(r2Key, pdfBuffer);

    // TODO: Create document record in database with status='pending'
    // await supabase.from('documents').insert({
    //   uploader_id: userId,
    //   file_path: r2Key,
    //   status: 'pending',
    //   source_type: 'converted_image',
    //   ...
    // });

    // TODO: Send notification to admins
    // await notifyAdmins('New image upload pending review');

    return NextResponse.json<
      ApiResponse<{ message: string; fileCount: number; status: string }>
    >({
      success: true,
      data: {
        message: `${files.length} image(s) submitted for admin review`,
        fileCount: files.length,
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
