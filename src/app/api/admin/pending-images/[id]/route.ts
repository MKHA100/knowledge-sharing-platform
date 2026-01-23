import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import { Readable, PassThrough } from "stream";
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

// R2 client for image operations
const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Helper function to convert AWS SDK stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * GET /api/admin/pending-images/[id]/download
 * Downloads all images in a pending batch as a zip file
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch the pending image batch with uploader info
    const { data: batch, error } = await supabaseAdmin
      .from("pending_images")
      .select("file_paths, uploader_id")
      .eq("id", id)
      .single();

    if (error || !batch) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Pending image batch not found" },
        { status: 404 },
      );
    }

    // Get uploader info for better file naming
    const { data: uploader } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("id", batch.uploader_id)
      .single();

    const uploaderName = uploader?.name?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown";
    const timestamp = new Date().toISOString().split("T")[0];

    // Create a zip archive with store compression for faster processing
    const archive = archiver("zip", {
      zlib: { level: 6 }, // Balanced compression
    });

    // Collect archive data into buffer
    const chunks: Buffer[] = [];
    
    // Important: Collect data before finalizing
    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Handle errors
    archive.on("error", (err) => {
      throw err;
    });

    // Download each image from R2 and add to archive
    const downloadPromises = batch.file_paths.map(async (filePath: string, i: number) => {
      try {
        const response = await R2.send(
          new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: filePath,
          })
        );

        if (response.Body) {
          // Convert the readable stream to buffer
          const bodyBuffer = await streamToBuffer(response.Body as Readable);
          const extension = filePath.split(".").pop() || "jpg";
          const filename = `image-${String(i + 1).padStart(3, "0")}.${extension}`;
          
          return { filename, buffer: bodyBuffer };
        }
      } catch (err) {
        console.error(`Error downloading ${filePath}:`, err);
      }
      return null;
    });

    const downloadedFiles = await Promise.all(downloadPromises);

    // Add all successfully downloaded files to archive
    for (const file of downloadedFiles) {
      if (file) {
        archive.append(file.buffer, { name: file.filename });
      }
    }

    // Finalize the archive - this triggers 'end' event
    const finalizePromise = new Promise<void>((resolve, reject) => {
      archive.on("end", () => {
        console.log("Archive finalized successfully");
        resolve();
      });
      archive.on("error", reject);
    });

    // Must call finalize to trigger the 'end' event
    archive.finalize();

    // Wait for archive to complete
    await finalizePromise;

    const buffer = Buffer.concat(chunks);
    const zipFilename = `images-${uploaderName}-${timestamp}-${id.slice(0, 8)}.zip`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading images:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to download images" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/pending-images/[id]
 * Deletes a pending image batch and its files from R2
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch the pending image batch
    const { data: batch, error: fetchError } = await supabaseAdmin
      .from("pending_images")
      .select("file_paths")
      .eq("id", id)
      .single();

    if (fetchError || !batch) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Pending image batch not found" },
        { status: 404 },
      );
    }

    // Delete files from R2
    for (const filePath of batch.file_paths) {
      try {
        await R2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: filePath,
          })
        );
      } catch (error) {
        console.error(`Error deleting ${filePath} from R2:`, error);
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabaseAdmin
      .from("pending_images")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting pending image batch:", deleteError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to delete batch" },
        { status: 500 },
      );
    }

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: { message: "Pending image batch deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting pending images:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete images" },
      { status: 500 },
    );
  }
}
