import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function verifyAdmin(): Promise<{
  isAdmin: boolean;
  userId: string | null;
  dbUserId: string | null;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { isAdmin: false, userId: null, dbUserId: null };
  }

  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  return {
    isAdmin: user?.role === "admin",
    userId,
    dbUserId: user?.id || null,
  };
}
