import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { uploadToR2, deleteFromR2 } from "@/lib/r2/client";
import type { ApiResponse } from "@/types";

/**
 * POST /api/admin/pending-images/[id]/upload
 * Admin uploads compiled PDF for a pending image batch
 * This creates a document as if the original user uploaded it
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (adminError || !adminData || adminData.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Get the pending images batch
    const { data: batch, error: batchError } = await supabase
      .from("pending_images")
      .select("*, users!uploader_id(id, clerk_id, name, email)")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { success: false, error: "Pending image batch not found or already processed" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("type") as string;
    const subject = formData.get("subject") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const medium = formData.get("medium") as string;

    if (!file || !documentType || !subject || !title) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate PDF
    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Upload to R2 using the standard upload function (flat structure)
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadToR2(
      buffer,
      file.name,
      "application/pdf",
      "documents"
    );

    // Create document record as if the original user uploaded it
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title,
        description: description || null,
        type: documentType,
        subject,
        medium,
        file_path: uploaded.url,
        file_size: uploaded.size,
        uploader_id: batch.uploader_id, // Original user who submitted images
        status: "approved", // Auto-approve since admin is uploading
        uploaded_by_admin: true,
        admin_uploaded_by: adminData.id,
        original_image_batch_id: id,
      })
      .select()
      .single();

    if (docError) {
      // Cleanup uploaded file if document creation fails
      await deleteFromR2(uploaded.key);
      
      console.error("Failed to create document:", docError);
      return NextResponse.json(
        { success: false, error: "Failed to create document" },
        { status: 500 }
      );
    }

    // Delete original images from R2
    const deletePromises = batch.file_paths.map(async (imagePath: string) => {
      try {
        await deleteFromR2(imagePath);
      } catch (error) {
        console.error(`Failed to delete ${imagePath}:`, error);
      }
    });
    await Promise.allSettled(deletePromises);

    // Mark batch as processed
    const { error: updateError } = await supabase
      .from("pending_images")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        processed_by: adminData.id,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update batch status:", updateError);
      // Don't fail the request, document is already created
    }

    // Send notification to uploader
    try {
      await supabase.from("notifications").insert({
        user_id: batch.uploader_id,
        type: "system",
        title: "Your images have been published!",
        message: `Your submitted images have been compiled and published as "${title}". Thank you for your contribution!`,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
      // Don't fail the request
    }

    return NextResponse.json<ApiResponse<{ documentId: string }>>({
      success: true,
      data: { documentId: document.id },
      message: "Document published successfully",
    });
  } catch (error) {
    console.error("Error uploading compiled document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
