import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Ensures user exists in Supabase (fallback if webhook missed)
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    // If user exists, just return success
    if (existingUser) {
      return NextResponse.json({ data: existingUser, synced: false });
    }

    // If error is not "no rows found", it's a real error
    if (selectError && selectError.code !== "PGRST116") {
      console.error("User sync select error:", selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    // Create user if not exists
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        clerk_id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Anonymous",
        avatar_url: user.imageUrl,
        role: "user",
      })
      .select()
      .single();

    if (insertError) {
      console.error("User sync insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ data: newUser, synced: true });
  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
