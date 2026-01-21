import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCommentSchema } from "@/lib/validations/schemas";
import type { ApiResponse, Comment } from "@/types";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parseResult = createCommentSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Invalid data" },
      { status: 400 },
    );
  }

  const { documentId, happinessLevel, message } = parseResult.data;

  const supabase = createAdminClient();

  // Get user
  const { data: user } = await supabase
    .from("users")
    .select("id, name")
    .eq("clerk_id", userId)
    .single();

  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User not found" },
      { status: 404 },
    );
  }

  // Get document to notify uploader
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

  // Create comment
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      document_id: documentId,
      sender_id: user.id,
      happiness_level: happinessLevel,
      message,
      is_admin_complement: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // Mark download as commented
  await supabase
    .from("user_downloads")
    .update({ has_commented: true })
    .eq("user_id", user.id)
    .eq("document_id", documentId);

  // Notify uploader (if not self and within limit)
  if (document.uploader_id && document.uploader_id !== user.id) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", document.uploader_id)
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );

    if ((count || 0) < 5) {
      const happinessEmoji = {
        helpful: "😊",
        very_helpful: "😃",
        life_saver: "🤩",
      };

      await supabase.from("notifications").insert({
        user_id: document.uploader_id,
        type: "comment_received",
        title: `${happinessEmoji[happinessLevel]} New Comment!`,
        message: message
          ? `"${message.substring(0, 100)}${message.length > 100 ? "..." : ""}" on your "${document.title}"`
          : `Someone found your "${document.title}" ${happinessLevel.replace("_", " ")}!`,
        link: `/doc/${document.id}`,
      });
    }
  }

  return NextResponse.json<ApiResponse<Comment>>({
    success: true,
    data: comment,
    message: "Comment sent! Thank you for making the contributor's day better.",
  });
}
