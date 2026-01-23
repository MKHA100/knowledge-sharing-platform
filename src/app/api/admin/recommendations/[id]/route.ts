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

/**
 * PATCH /api/admin/recommendations/[id]
 * Update a recommendation status (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { status, admin_notes } = body as { 
      status?: "pending" | "reviewed" | "implemented" | "rejected";
      admin_notes?: string;
    };

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
      updates.reviewed_by = user.id;
      updates.reviewed_at = new Date().toISOString();
    }

    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes;
    }

    const { error } = await supabaseAdmin
      .from("recommendations")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating recommendation:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to update recommendation" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    console.error("Error updating recommendation:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update recommendation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/recommendations/[id]
 * Delete a recommendation (admin only)
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

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("recommendations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting recommendation:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to delete recommendation" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete recommendation" },
      { status: 500 }
    );
  }
}
