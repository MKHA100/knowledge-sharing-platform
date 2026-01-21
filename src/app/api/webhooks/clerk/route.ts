import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  const supabase = createAdminClient();

  switch (evt.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const { error } = await supabase.from("users").insert({
        clerk_id: id,
        email: email_addresses[0]?.email_address || "",
        name: `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous",
        avatar_url: image_url,
        role: "user",
      });

      if (error) {
        console.error("Failed to create user:", error);
        return new NextResponse("Failed to create user", { status: 500 });
      }
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const { error } = await supabase
        .from("users")
        .update({
          email: email_addresses[0]?.email_address,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          avatar_url: image_url,
        })
        .eq("clerk_id", id);

      if (error) {
        console.error("Failed to update user:", error);
      }
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;

      // Set uploader to null for documents (keeps them as Anonymous)
      await supabase
        .from("documents")
        .update({ uploader_id: null })
        .eq("uploader_id", id);

      // Delete user
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("clerk_id", id);

      if (error) {
        console.error("Failed to delete user:", error);
      }
      break;
    }
  }

  return new NextResponse("Webhook processed", { status: 200 });
}
