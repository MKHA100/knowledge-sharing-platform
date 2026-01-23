import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToR2 } from "@/lib/r2/client";
import { uploadDocumentSchema } from "@/lib/validations/schemas";
import { isValidFileType, getMimeType } from "@/lib/utils";
import { convertToPdf, isImageFile } from "@/lib/utils/pdf-converter";
import { generatePDFThumbnail } from "@/lib/utils/thumbnail-generator";
import type { ApiResponse, Document } from "@/types";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  // Get user from database
  const { data: user, error: userError } = await supabase
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

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const documentType = formData.get("documentType") as string | null;
    const subject = formData.get("subject") as string | null;
    const medium = formData.get("medium") as string | null;
    const title = formData.get("title") as string | null;

    if (!files.length) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    // Validate required fields for user-verified uploads
    if (!documentType || !subject || !medium) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Document type, subject, and medium are required",
        },
        { status: 400 },
      );
    }

    const results: Document[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!isValidFileType(file.name)) {
        errors.push(`${file.name}: Invalid file type`);
        continue;
      }

      try {
        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = getMimeType(file.name);

        // Check if file is an image (should have been routed to admin submission)
        const isImage = isImageFile(mimeType);
        if (isImage) {
          errors.push(
            `${file.name}: Images should be submitted for admin review`,
          );
          continue;
        }

        // Convert to PDF if needed (Word docs, etc.)
        let pdfBuffer: Buffer;
        let sourceType: "pdf" | "converted_image" | "converted_docx";

        try {
          const result = await convertToPdf(buffer, mimeType);
          pdfBuffer = result.pdfBuffer;
          sourceType = result.sourceType;
        } catch {
          // If conversion fails, use original buffer
          pdfBuffer = buffer;
          sourceType = "pdf";
        }

        // Upload to R2 documents folder (no pending for user-verified uploads)
        const uploaded = await uploadToR2(
          pdfBuffer,
          file.name.replace(/\.[^/.]+$/, ".pdf"),
          "application/pdf",
          "documents",
        );

        // Generate thumbnail from the PDF
        let thumbnailUrl: string | null = null;
        try {
          const thumbnailBuffer = await generatePDFThumbnail(pdfBuffer, 600, 85);
          const thumbnailFileName = `${file.name.replace(/\.[^/.]+$/, "")}_thumb.jpg`;
          const thumbnailUpload = await uploadToR2(
            thumbnailBuffer,
            thumbnailFileName,
            "image/jpeg",
            "thumbnails",
          );
          thumbnailUrl = thumbnailUpload.url;
        } catch (thumbnailError) {
          console.error(`Failed to generate thumbnail for ${file.name}:`, thumbnailError);
          // Continue without thumbnail - not a critical failure
        }

        // User has verified the details, so auto-approve
        // Only image uploads (handled separately) go to admin
        const status = "approved";

        // Insert document with user-verified values
        const insertData = {
          title: title || file.name.replace(/\.[^/.]+$/, ""),
          uploader_id: user.id,
          file_path: uploaded.url,
          file_size: uploaded.size,
          thumbnail_url: thumbnailUrl,
          type: documentType,
          subject: subject,
          medium: medium,
          status,
        };

        const { data: document, error: insertError } = await supabase
          .from("documents")
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          errors.push(`${file.name}: ${insertError.message}`);
          continue;
        }

        results.push(document);

        // Create notification for uploader
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "upload_processed",
          title: "Upload Successful!",
          message: `Your document "${document.title}" is now live and helping students!`,
          action_url: `/doc/${document.id}`,
        });
      } catch (fileError) {
        errors.push(`${file.name}: Processing failed`);
        console.error(`Error processing ${file.name}:`, fileError);
      }
    }

    return NextResponse.json<
      ApiResponse<{ uploaded: Document[]; errors: string[] }>
    >({
      success: true,
      data: { uploaded: results, errors },
      message: `${results.length} file(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
