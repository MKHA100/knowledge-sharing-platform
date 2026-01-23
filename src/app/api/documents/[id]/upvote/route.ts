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

  // Try RPC first (handle_upvote or toggle_upvote)
  let result = await supabase.rpc("handle_upvote", {
    doc_id: id,
    voter_id: user.id,
  });

  if (result.error) {
    // Try toggle_upvote as fallback
    result = await supabase.rpc("toggle_upvote", {
      doc_id: id,
      user_id_param: user.id,
    });
  }

  if (result.error) {
    // Manual fallback if no RPC exists
    const { data: existingVote } = await supabase
      .from("document_votes")
      .select("vote_type")
      .eq("user_id", user.id)
      .eq("document_id", id)
      .single();

    const { data: doc } = await supabase
      .from("documents")
      .select("upvotes, downvotes")
      .eq("id", id)
      .single();

    if (!doc) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    let newUpvotes = doc.upvotes || 0;
    let newDownvotes = doc.downvotes || 0;
    let userVote: string | null = null;

    if (!existingVote) {
      // Add upvote
      await supabase.from("document_votes").insert({
        user_id: user.id,
        document_id: id,
        vote_type: "upvote",
      });
      newUpvotes += 1;
      userVote = "upvote";
    } else if (existingVote.vote_type === "upvote") {
      // Remove upvote
      await supabase
        .from("document_votes")
        .delete()
        .eq("user_id", user.id)
        .eq("document_id", id);
      newUpvotes -= 1;
      userVote = null;
    } else {
      // Change from downvote to upvote
      await supabase
        .from("document_votes")
        .update({ vote_type: "upvote" })
        .eq("user_id", user.id)
        .eq("document_id", id);
      newUpvotes += 1;
      newDownvotes -= 1;
      userVote = "upvote";
    }

    await supabase
      .from("documents")
      .update({ upvotes: newUpvotes, downvotes: newDownvotes })
      .eq("id", id);

    return NextResponse.json<
      ApiResponse<{
        upvotes: number;
        downvotes: number;
        user_vote: string | null;
      }>
    >({
      success: true,
      data: {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        user_vote: userVote,
      },
      message: userVote ? "Added to liked documents" : "Removed from liked",
    });
  }

  return NextResponse.json<ApiResponse<any>>({
    success: true,
    data: result.data,
    message: result.data?.user_vote
      ? "Added to liked documents"
      : "Removed from liked",
  });
}

// GET /api/documents/[id]/upvote - Check user's vote status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json<ApiResponse<{ user_vote: string | null }>>({
      success: true,
      data: { user_vote: null },
    });
  }

  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (!user) {
    return NextResponse.json<ApiResponse<{ user_vote: string | null }>>({
      success: true,
      data: { user_vote: null },
    });
  }

  const { data: existingVote } = await supabase
    .from("document_votes")
    .select("vote_type")
    .eq("user_id", user.id)
    .eq("document_id", id)
    .single();

  return NextResponse.json<ApiResponse<{ user_vote: string | null }>>({
    success: true,
    data: { user_vote: existingVote?.vote_type || null },
  });
}
