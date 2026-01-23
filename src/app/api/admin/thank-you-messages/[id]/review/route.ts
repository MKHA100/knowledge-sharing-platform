import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is admin
    const { data: admin } = await supabase
      .from("users")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { action, editedMessage } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the thank you message
    const { data: thankYouMessage, error: fetchError } = await supabase
      .from("thank_you_messages")
      .select(
        `
        *,
        sender:users!thank_you_messages_sender_id_fkey(id, name),
        recipient:users!thank_you_messages_recipient_id_fkey(id)
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !thankYouMessage) {
      return NextResponse.json(
        { error: "Thank you message not found" },
        { status: 404 }
      );
    }

    if (thankYouMessage.status !== "pending_review") {
      return NextResponse.json(
        { error: "Message already reviewed" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      // Silent rejection - just update status, no notification
      const { error: updateError } = await supabase
        .from("thank_you_messages")
        .update({
          status: "rejected",
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        console.error("Failed to reject message:", updateError);
        return NextResponse.json(
          { error: "Failed to reject message" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Message rejected (silent)",
      });
    }

    // Approve action
    const finalMessage = editedMessage?.trim() || thankYouMessage.message;

    // Update thank you message status
    const { error: updateError } = await supabase
      .from("thank_you_messages")
      .update({
        status: "approved",
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        admin_edited_message: editedMessage ? finalMessage : null,
        notification_sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to approve message:", updateError);
      return NextResponse.json(
        { error: "Failed to approve message" },
        { status: 500 }
      );
    }

    // Create notification for recipient
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: thankYouMessage.recipient_id,
      type: "thank_you",
      title: `${thankYouMessage.sender.name || "Someone"} thanked you!`,
      message: finalMessage,
      is_read: false,
    });

    if (notifError) {
      console.error("Failed to create notification:", notifError);
      return NextResponse.json(
        { error: "Approved but failed to send notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message approved and notification sent",
    });
  } catch (error) {
    console.error("Error in admin thank-you review API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
