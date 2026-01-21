import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { ApiResponse } from "@/types";
import {
  createSampledPdf,
  shouldSamplePdf,
  getPdfMetadata,
} from "@/lib/utils/pdf-extractor";
import {
  convertToPdf,
  isPdfFile,
  isWordDocument,
} from "@/lib/utils/pdf-converter";

// App Router route segment config
export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for AI processing

// Gemini API for document categorization
// Support both GEMINI_API_KEY and GOOGLE_AI_API_KEY
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
// Using Gemini 2.0 Flash - the latest and fastest model
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

// Expected subjects for O-Level Sri Lanka curriculum
const EXPECTED_SUBJECTS = [
  // Religion subjects
  "Buddhism",
  "Catholicism",
  "Saivanery",
  "Christianity",
  "Islam",
  // Core subjects
  "English",
  "Sinhala Language & Literature",
  "Tamil Language & Literature",
  "Mathematics",
  "History",
  "Science",
  // Category I subjects
  "Civic Education",
  "Business & Accounting",
  "Geography",
  "Entrepreneurship",
  "Second Language Sinhala",
  "Second Language Tamil",
  "Pali",
  "Sanskrit",
  "French",
  "German",
  "Hindi",
  "Japanese",
  "Arabic",
  "Korean",
  "Chinese",
  "Russian",
  // Category II subjects
  "Music (Oriental)",
  "Music (Western)",
  "Music (Carnatic)",
  "Dancing (Oriental)",
  "Dancing (Bharata)",
  "English Literary Texts",
  "Sinhala Literary Texts",
  "Tamil Literary Texts",
  "Arabic Literary Texts",
  "Drama & Theatre",
  // Category III subjects
  "ICT",
  "Agriculture & Food Technology",
  "Aquatic Bioresources",
  "Art & Crafts",
  "Home Economics",
  "Health & Physical Education",
  "Communication & Media",
  "Design & Construction Technology",
  "Design & Mechanical Technology",
  "Design & Electrical/Electronic Technology",
];

// Expected languages/mediums
const EXPECTED_LANGUAGES = ["Sinhala", "English", "Tamil"];

// Document types
const DOCUMENT_TYPES = ["Book", "Short Note", "Past Paper", "Mixed/Other"];

interface CategorizeRequest {
  fileName: string;
  fileContent?: string; // Base64 encoded content or extracted text
  mimeType?: string;
}

interface CategorizeResponse {
  subject: string;
  subjectConfidence: number;
  language: string;
  languageConfidence: number;
  documentType: string;
  documentTypeConfidence: number;
  suggestedTitle: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body: CategorizeRequest = await request.json();
    const { fileName, fileContent, mimeType } = body;

    const defaultResponse: CategorizeResponse = {
      subject: "Mathematics",
      subjectConfidence: 0.5,
      language: "English",
      languageConfidence: 0.5,
      documentType: "Short Note",
      documentTypeConfidence: 0.5,
      suggestedTitle: fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
    };

    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set, using default categorization");
      return NextResponse.json<ApiResponse<CategorizeResponse>>({
        success: true,
        data: defaultResponse,
      });
    }

    // Prepare the document for Gemini
    let pdfBase64: string | null = null;

    // Check if we have file content to analyze
    const hasFileContent = fileContent && fileContent.length > 0;

    if (hasFileContent && mimeType) {
      try {
        const fileBuffer = Buffer.from(fileContent, "base64");

        // Convert to PDF if needed
        let pdfBuffer: Buffer;
        if (isPdfFile(mimeType)) {
          pdfBuffer = fileBuffer;
        } else if (isWordDocument(mimeType)) {
          // For Word docs, convert to PDF
          const result = await convertToPdf(fileBuffer, mimeType);
          pdfBuffer = result.pdfBuffer;
        } else {
          // For other types (images), just use base64 directly
          pdfBase64 = fileContent;
        }

        // For PDFs, apply page sampling for efficiency
        if (pdfBuffer!) {
          const metadata = await getPdfMetadata(pdfBuffer);

          // If document has many pages, sample only key pages
          if (shouldSamplePdf(metadata.pageCount)) {
            console.log(`Sampling PDF: ${metadata.pageCount} pages → 3 pages`);
            const sampledPdf = await createSampledPdf(pdfBuffer);
            pdfBase64 = sampledPdf.toString("base64");
          } else {
            pdfBase64 = pdfBuffer.toString("base64");
          }
        }
      } catch (error) {
        console.error("Error processing file:", error);
        // Fall back to filename-only analysis
        console.log("File processing failed, using filename-only analysis");
      }
    }

    // Build the Gemini request with multimodal content
    const hasDocument = !!pdfBase64;
    const prompt = `You are an AI assistant that categorizes educational documents for Sri Lankan O-Level students.

${hasDocument ? "Analyze this document and determine:" : "Based on the filename, determine:"}

1. SUBJECT: Which O-Level subject does this document belong to?
   Options: ${EXPECTED_SUBJECTS.join(", ")}

2. LANGUAGE: What language is the document primarily written in?
   Options: ${EXPECTED_LANGUAGES.join(", ")}

3. DOCUMENT TYPE: What type of educational material is this?
   Options: ${DOCUMENT_TYPES.join(", ")}

4. SUGGESTED TITLE: Provide a clean, descriptive title for this document.

File Name: ${fileName}

${
  hasDocument
    ? "Look at the document content carefully. Analyze any visible text, headings, or educational content to determine the subject and language."
    : "Use the filename to infer the subject and likely language. Common patterns: 'Business' = Business & Accounting, 'Maths/Math' = Mathematics, 'Science' = Science, etc. If the filename suggests Sinhala content use 'Sinhala', otherwise default to 'English'."
}

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{
  "subject": "subject name from the list",
  "subjectConfidence": 0.0 to 1.0,
  "language": "language from the list",
  "languageConfidence": 0.0 to 1.0,
  "documentType": "type from the list",
  "documentTypeConfidence": 0.0 to 1.0,
  "suggestedTitle": "Clean document title"
}`;

    // Build the parts array for Gemini
    const parts: Array<{
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }> = [{ text: prompt }];

    // Add the document if we have it
    if (pdfBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType?.includes("pdf")
            ? "application/pdf"
            : mimeType || "application/pdf",
          data: pdfBase64,
        },
      });
    }

    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json<ApiResponse<CategorizeResponse>>({
        success: true,
        data: defaultResponse,
      });
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response
    let categorization: CategorizeResponse;
    try {
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
      categorization = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse Gemini response:", responseText);
      categorization = defaultResponse;
    }

    return NextResponse.json<ApiResponse<CategorizeResponse>>({
      success: true,
      data: categorization,
    });
  } catch (error) {
    console.error("Categorization error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to categorize document" },
      { status: 500 },
    );
  }
}
