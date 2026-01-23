import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/types";

// Admin client with service role key for inserting without auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface RecommendationInput {
  name: string;
  email: string;
  message: string;
}

/**
 * POST /api/recommendations
 * Submit a new recommendation/feedback (public endpoint)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as RecommendationInput;
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Message must be at least 10 characters long" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Message must be less than 2000 characters" },
        { status: 400 }
      );
    }

    // Insert the recommendation
    const { data, error } = await supabaseAdmin
      .from("recommendations")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting recommendation:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to submit recommendation" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id: data.id },
    });
  } catch (error) {
    console.error("Error submitting recommendation:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to submit recommendation" },
      { status: 500 }
    );
  }
}
