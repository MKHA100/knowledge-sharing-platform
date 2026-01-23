import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/documents/convert-word
 * Converts Word documents (.doc, .docx) to PDF format
 * For now, this is a placeholder that requires external service integration
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Check if it's a Word document
    const isWordDoc = 
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword";

    if (!isWordDoc) {
      return NextResponse.json(
        { success: false, error: "File must be a Word document" },
        { status: 400 },
      );
    }

    // For now, we'll use a third-party API for conversion
    // You can use services like:
    // 1. Cloudmersive API
    // 2. ConvertAPI
    // 3. LibreOffice via command line
    // 4. Microsoft Graph API
    
    // Example using Cloudmersive (you'll need to sign up for an API key)
    const CLOUDMERSIVE_API_KEY = process.env.CLOUDMERSIVE_API_KEY;
    
    if (!CLOUDMERSIVE_API_KEY) {
      // Fallback: Return original file with error message
      return NextResponse.json(
        { 
          success: false, 
          error: "Word to PDF conversion not configured. Please configure CLOUDMERSIVE_API_KEY environment variable." 
        },
        { status: 500 },
      );
    }

    // Convert Word to PDF using Cloudmersive
    const convertFormData = new FormData();
    convertFormData.append("inputFile", file);

    const response = await fetch(
      "https://api.cloudmersive.com/convert/docx/to/pdf",
      {
        method: "POST",
        headers: {
          "Apikey": CLOUDMERSIVE_API_KEY,
        },
        body: convertFormData,
      }
    );

    if (!response.ok) {
      throw new Error("Conversion failed");
    }

    const pdfBlob = await response.blob();
    
    return new NextResponse(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(/\.(docx?|DOCX?)$/, ".pdf")}"`,
      },
    });

  } catch (error) {
    console.error("Word to PDF conversion error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to convert Word document to PDF" 
      },
      { status: 500 },
    );
  }
}
