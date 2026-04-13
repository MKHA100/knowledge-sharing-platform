import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/utils/admin";

/**
 * POST /api/admin/link-migrated-users
 *
 * One-time backfill endpoint: fetches every user from the production Clerk
 * instance and re-stamps their clerk_id onto the matching Supabase row
 * (matched by email). This fixes the gap where the migration tool created
 * users in Clerk BEFORE the webhook re-linking code was deployed.
 *
 * After running this, all 19 migrated users will see their historical uploads.
 * Safe to call more than once — skips rows that already have the correct id.
 */
export async function POST() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const client = await clerkClient();

  // Fetch up to 500 users from Clerk production (well above the 19 we have)
  const { data: clerkUsers } = await client.users.getUserList({ limit: 500 });

  const results = {
    updated: [] as string[],
    alreadyLinked: [] as string[],
    notInSupabase: [] as string[],
    errors: [] as string[],
  };

  for (const clerkUser of clerkUsers) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) continue;

    // Find the Supabase row by email
    const { data: supabaseUser, error: fetchError } = await supabase
      .from("users")
      .select("id, clerk_id, email")
      .eq("email", email)
      .single();

    if (fetchError || !supabaseUser) {
      results.notInSupabase.push(email);
      continue;
    }

    // Already correct — nothing to do
    if (supabaseUser.clerk_id === clerkUser.id) {
      results.alreadyLinked.push(email);
      continue;
    }

    // Mismatch — update the clerk_id to the production ID
    const { error: updateError } = await supabase
      .from("users")
      .update({
        clerk_id: clerkUser.id,
        // Refresh avatar from Clerk too in case it changed
        avatar_url: clerkUser.imageUrl || null,
      })
      .eq("id", supabaseUser.id);

    if (updateError) {
      console.error(`Failed to update ${email}:`, updateError);
      results.errors.push(email);
    } else {
      results.updated.push(email);
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      updated: results.updated.length,
      alreadyLinked: results.alreadyLinked.length,
      notInSupabase: results.notInSupabase.length,
      errors: results.errors.length,
    },
    details: results,
  });
}
