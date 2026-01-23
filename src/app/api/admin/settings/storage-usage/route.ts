import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

// R2 client
const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface StorageUsageResponse {
  usedBytes: number;
  usedGB: string;
  limitBytes: number;
  limitGB: string;
  percentUsed: number;
  objectCount: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

// Storage limit: 2GB in bytes
const STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const WARNING_THRESHOLD = 0.9; // 90% = 1.8GB

/**
 * GET /api/admin/settings/storage-usage
 * Returns current R2 storage usage (admin only)
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Authentication required" },
        { status: 401 }
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
        { status: 403 }
      );
    }

    // List all objects in the R2 bucket to calculate total size
    let totalSize = 0;
    let objectCount = 0;
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        ContinuationToken: continuationToken,
      });

      const response = await R2.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          totalSize += object.Size || 0;
          objectCount++;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    const percentUsed = (totalSize / STORAGE_LIMIT_BYTES) * 100;
    const isNearLimit = percentUsed >= WARNING_THRESHOLD * 100;
    const isAtLimit = totalSize >= STORAGE_LIMIT_BYTES;

    // If at limit, automatically disable uploads
    if (isAtLimit) {
      await supabaseAdmin
        .from("system_settings")
        .upsert({
          key: "uploads_enabled",
          value: {
            enabled: false,
            reason: "Storage limit reached. Uploads have been automatically disabled.",
            auto_disabled: true,
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "key",
        });
    }

    const response: StorageUsageResponse = {
      usedBytes: totalSize,
      usedGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      limitBytes: STORAGE_LIMIT_BYTES,
      limitGB: (STORAGE_LIMIT_BYTES / (1024 * 1024 * 1024)).toFixed(2),
      percentUsed: Math.round(percentUsed * 100) / 100,
      objectCount,
      isNearLimit,
      isAtLimit,
    };

    return NextResponse.json<ApiResponse<StorageUsageResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching storage usage:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch storage usage" },
      { status: 500 }
    );
  }
}
