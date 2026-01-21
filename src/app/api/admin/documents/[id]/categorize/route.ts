import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorizeDocumentSchema } from "@/lib/validations/schemas";
import type { ApiResponse, Document } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parseResult = categorizeDocumentSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Invalid data" },
      { status: 400 },
    );
  }

  const { documentType, subject, medium, title } = parseResult.data;

  const supabase = createAdminClient();

  const updateData: Record<string, any> = {
    document_type: documentType,
    subject,
    medium,
    needs_admin_review: false,
  };

  if (title) {
    updateData.title = title;
  }

  const { data: updated, error } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<Document>>({
    success: true,
    data: updated,
    message: "Document categorized",
  });
}
