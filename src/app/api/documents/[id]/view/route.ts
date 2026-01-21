import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Try RPC first
  const { error: rpcError } = await supabase.rpc("increment_view", {
    doc_id: id,
  });

  if (rpcError) {
    // Fallback: Direct increment if RPC doesn't exist yet
    const { data: doc } = await supabase
      .from("documents")
      .select("views")
      .eq("id", id)
      .single();

    if (doc) {
      await supabase
        .from("documents")
        .update({ views: (doc.views || 0) + 1 })
        .eq("id", id);
    }
  }

  return NextResponse.json<ApiResponse<null>>({
    success: true,
    message: "View recorded",
  });
}
