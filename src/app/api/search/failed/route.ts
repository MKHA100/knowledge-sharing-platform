import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logFailedSearchSchema } from "@/lib/validations/schemas";
import { normalizeSearchQuery } from "@/lib/utils";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parseResult = logFailedSearchSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Invalid data" },
      { status: 400 },
    );
  }

  const { query, subject, medium, documentType } = parseResult.data;
  const normalizedQuery = normalizeSearchQuery(query);

  const supabase = createAdminClient();

  // Try to update existing or insert new
  const { data: existing } = await supabase
    .from("failed_searches")
    .select("id, search_count")
    .eq("normalized_query", normalizedQuery)
    .single();

  if (existing) {
    await supabase
      .from("failed_searches")
      .update({
        search_count: existing.search_count + 1,
        last_searched_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("failed_searches").insert({
      query,
      normalized_query: normalizedQuery,
      subject,
      medium,
      document_type: documentType,
    });
  }

  return NextResponse.json<ApiResponse<null>>({
    success: true,
    message: "Search logged",
  });
}
