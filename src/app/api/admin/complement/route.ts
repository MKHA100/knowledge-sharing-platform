import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminComplementSchema } from "@/lib/validations/schemas";
import type { ApiResponse, Comment } from "@/types";

export async function POST(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parseResult = adminComplementSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Invalid data" },
      { status: 400 },
    );
  }

  const { documentId, userId, senderDisplayName, happinessLevel, message } =
    parseResult.data;

  const supabase = createAdminClient();

  // Get document
  const { data: document } = await supabase
    .from("documents")
    .select("id, title, uploader_id")
    .eq("id", documentId)
    .single();

  if (!document) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Document not found" },
      { status: 404 },
    );
  }

  // Create complement comment
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      document_id: documentId,
      user_id: null, // Admin-created, no real user
      admin_name: senderDisplayName,
      happiness: happinessLevel,
      content: message,
      is_admin_complement: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // Notify the uploader
  if (document.uploader_id) {
    const happinessEmoji = {
      helpful: "😊",
      very_helpful: "😃",
      life_saver: "🤩",
    };

    await supabase.from("notifications").insert({
      user_id: document.uploader_id,
      type: "complement",
      title: `${happinessEmoji[happinessLevel]} ${senderDisplayName} loved your notes!`,
      message: `"${message}" on your "${document.title}"`,
      action_url: `/doc/${document.id}`,
    });
  }

  return NextResponse.json<ApiResponse<Comment>>({
    success: true,
    data: comment,
    message: "Complement sent successfully",
  });
}
