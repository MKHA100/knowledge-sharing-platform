import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  // Get user
  const { data: user } = await supabase
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

  // Check if already saved
  const { data: existing } = await supabase
    .from("user_saved")
    .select("id")
    .eq("user_id", user.id)
    .eq("document_id", id)
    .single();

  if (existing) {
    // Remove from saved
    await supabase
      .from("user_saved")
      .delete()
      .eq("user_id", user.id)
      .eq("document_id", id);

    return NextResponse.json<ApiResponse<{ saved: boolean }>>({
      success: true,
      data: { saved: false },
    });
  } else {
    // Add to saved
    await supabase.from("user_saved").insert({
      user_id: user.id,
      document_id: id,
    });

    return NextResponse.json<ApiResponse<{ saved: boolean }>>({
      success: true,
      data: { saved: true },
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<{ saved: boolean }>>({
      success: true,
      data: { saved: false },
    });
  }

  const supabase = createAdminClient();

  // Get user
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (!user) {
    return NextResponse.json<ApiResponse<{ saved: boolean }>>({
      success: true,
      data: { saved: false },
    });
  }

  // Check if saved
  const { data: existing } = await supabase
    .from("user_saved")
    .select("id")
    .eq("user_id", user.id)
    .eq("document_id", id)
    .single();

  return NextResponse.json<ApiResponse<{ saved: boolean }>>({
    success: true,
    data: { saved: !!existing },
  });
}
