import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateThankYouMessage } from "@/lib/ai/moderate-message";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId, message } = await req.json();

    if (!documentId || !message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Document ID and message are required" },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get sender info
    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (senderError || !sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get document and uploader info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, uploader_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Prevent sending message to yourself
    if (document.uploader_id === sender.id) {
      return NextResponse.json(
        { error: "Cannot send thank you message to yourself" },
        { status: 400 }
      );
    }

    // Run AI moderation
    const moderation = await moderateThankYouMessage(trimmedMessage);

    // Determine status based on AI recommendation
    const status = moderation.shouldAutoApprove ? "approved" : "pending_review";

    // Insert thank you message
    const { data: thankYouMessage, error: insertError } = await supabase
      .from("thank_you_messages")
      .insert({
        sender_id: sender.id,
        recipient_id: document.uploader_id,
        document_id: documentId,
        message: trimmedMessage,
        sentiment_category: moderation.category,
        ai_confidence: moderation.confidence,
        ai_reasoning: moderation.reasoning,
        status,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert thank you message:", insertError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // If auto-approved, create notification immediately
    if (status === "approved") {
      const { data: senderInfo } = await supabase
        .from("users")
        .select("name")
        .eq("id", sender.id)
        .single();

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: document.uploader_id,
        type: "thank_you",
        title: `${senderInfo?.name || "Someone"} thanked you!`,
        message: trimmedMessage,
        action_url: `/doc/${documentId}`,
        is_read: false,
      });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
      } else {
        // Update notification_sent_at
        await supabase
          .from("thank_you_messages")
          .update({ notification_sent_at: new Date().toISOString() })
          .eq("id", thankYouMessage.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: thankYouMessage.id,
        status,
        requiresReview: !moderation.shouldAutoApprove,
      },
    });
  } catch (error) {
    console.error("Error in thank-you API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
