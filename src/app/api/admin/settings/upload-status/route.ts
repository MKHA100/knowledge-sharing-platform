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

interface UploadStatusResponse {
  enabled: boolean;
  reason: string | null;
  autoDisabled: boolean;
}

/**
 * GET /api/admin/settings/upload-status
 * Returns whether uploads are currently enabled (public endpoint)
 */
export async function GET() {
  try {
    const { data: setting, error } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "uploads_enabled")
      .single();

    if (error || !setting) {
      // Default to enabled if setting doesn't exist
      return NextResponse.json<ApiResponse<UploadStatusResponse>>({
        success: true,
        data: {
          enabled: true,
          reason: null,
          autoDisabled: false,
        },
      });
    }

    const value = setting.value as { enabled: boolean; reason: string | null; auto_disabled: boolean };

    return NextResponse.json<ApiResponse<UploadStatusResponse>>({
      success: true,
      data: {
        enabled: value.enabled,
        reason: value.reason,
        autoDisabled: value.auto_disabled,
      },
    });
  } catch (error) {
    console.error("Error fetching upload status:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch upload status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/upload-status
 * Toggle upload functionality (admin only)
 */
export async function POST(request: Request) {
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
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, reason } = body as { enabled: boolean; reason?: string };

    // Update the setting
    const { error: updateError } = await supabaseAdmin
      .from("system_settings")
      .upsert({
        key: "uploads_enabled",
        value: {
          enabled,
          reason: enabled ? null : (reason || "Uploads temporarily paused by admin"),
          auto_disabled: false,
        },
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key",
      });

    if (updateError) {
      console.error("Error updating upload status:", updateError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to update upload status" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ enabled: boolean }>>({
      success: true,
      data: { enabled },
    });
  } catch (error) {
    console.error("Error toggling upload status:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to toggle upload status" },
      { status: 500 }
    );
  }
}
