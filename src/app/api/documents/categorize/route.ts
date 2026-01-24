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

// OpenRouter API for document categorization
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Using Gemini 2.0 Flash via OpenRouter - vision model for document analysis
// Using paid version (without :free) for dedicated rate limits with your credits
const VISION_MODEL = "google/gemini-2.0-flash-lite-001";
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

    if (!OPENROUTER_API_KEY) {
      console.warn("[Categorize API] OPENROUTER_API_KEY not set, using default categorization");
      return NextResponse.json<ApiResponse<CategorizeResponse>>({
        success: true,
        data: defaultResponse,
      });
    }

    // Prepare the document for Gemini
    let pdfBase64: string | null = null;

    // Check if we have file content to analyze
    const hasFileContent = fileContent && fileContent.length > 0;
    const inputSizeKB = hasFileContent ? Math.round(fileContent.length / 1024) : 0;
    console.log(`[Categorize API] Processing file: ${fileName}, Input size: ${inputSizeKB}KB, MIME: ${mimeType}`);

    if (hasFileContent && mimeType) {
      try {
        const fileBuffer = Buffer.from(fileContent, "base64");
        console.log(`[Categorize API] Decoded buffer size: ${Math.round(fileBuffer.length / 1024)}KB`);

        // Convert to PDF if needed
        let pdfBuffer: Buffer | undefined;
        if (isPdfFile(mimeType)) {
          pdfBuffer = fileBuffer;
          console.log(`[Categorize API] File is PDF, using as-is`);
        } else if (isWordDocument(mimeType)) {
          // For Word docs, convert to PDF
          const result = await convertToPdf(fileBuffer, mimeType);
          pdfBuffer = result.pdfBuffer;
          console.log(`[Categorize API] Converted Word doc to PDF: ${Math.round(pdfBuffer.length / 1024)}KB`);
        } else {
          // For other types (images), just use base64 directly
          pdfBase64 = fileContent;
          console.log(`[Categorize API] Using image directly as base64`);
        }

        // For PDFs, apply page sampling for efficiency
        if (pdfBuffer) {
          const metadata = await getPdfMetadata(pdfBuffer);
          console.log(`[Categorize API] PDF has ${metadata.pageCount} pages`);

          // If document has many pages, sample only key pages
          if (shouldSamplePdf(metadata.pageCount)) {
            console.log(`[Categorize API] Sampling PDF (${metadata.pageCount} pages -> 2 pages)`);
            const sampledPdf = await createSampledPdf(pdfBuffer);
            pdfBase64 = sampledPdf.toString("base64");
            console.log(`[Categorize API] Sampled PDF size: ${Math.round(sampledPdf.length / 1024)}KB`);
          } else {
            pdfBase64 = pdfBuffer.toString("base64");
            console.log(`[Categorize API] PDF small enough, using all ${metadata.pageCount} pages`);
          }
        }
      } catch (error) {
        console.error("[Categorize API] Error processing file:", error);
        // Fall back to filename-only analysis
      }
    }

    // Build the prompt with multimodal content
    const hasDocument = !!pdfBase64;
    const prompt = `You are an AI assistant that categorizes educational documents for Sri Lankan O-Level students.

CRITICAL: Carefully analyze the ACTUAL content and language of the document. Do NOT default to English or Mathematics.

${hasDocument ? "Analyze this document carefully and determine:" : "Based on the filename, determine:"}

1. SUBJECT: Which O-Level subject does this document belong to?
   Options: ${EXPECTED_SUBJECTS.join(", ")}

2. LANGUAGE: What language is the document primarily written in?
   Options: ${EXPECTED_LANGUAGES.join(", ")}
   IMPORTANT: 
   - Look at the ACTUAL TEXT in the document
   - If you see Sinhala script (සිංහල letters), the language is "Sinhala"
   - If you see Tamil script (தமிழ் letters), the language is "Tamil"
   - Only use "English" if the document is primarily in English
   - Having some English terms in a Sinhala/Tamil document is normal - classify by PRIMARY language

3. DOCUMENT TYPE: What type of educational material is this?
   Options: ${DOCUMENT_TYPES.join(", ")}
   - "Past Paper" includes: exam papers, test papers, question papers, model papers
   - "Short Note" includes: notes, summaries, revision notes, handwritten notes
   - "Book" includes: textbooks, chapters, reference materials

4. SUGGESTED TITLE: Provide a clean, descriptive title for this document.

File Name: ${fileName}

${
  hasDocument
    ? "Look at the document content carefully. Analyze any visible text, headings, or educational content to determine the subject and language. Pay special attention to non-English scripts."
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

    // Build the messages array for OpenRouter
    type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
    const content: ContentPart[] = [{ type: "text", text: prompt }];

    // Add the document if we have it
    if (pdfBase64) {
      const mimeTypeForImage = mimeType?.includes("pdf")
        ? "application/pdf"
        : mimeType || "application/pdf";
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeTypeForImage};base64,${pdfBase64}`,
        },
      });
    }

    // Log payload size for debugging rate limits
    const payloadSizeKB = pdfBase64 ? Math.round(pdfBase64.length / 1024) : 0;
    const estimatedTokens = pdfBase64 ? Math.round(payloadSizeKB * 0.75) : 0; // Rough estimate
    console.log(`[Categorize API] Using vision model: ${VISION_MODEL}`);
    console.log(`[Categorize API] Document included: ${hasDocument}, Payload size: ${payloadSizeKB}KB, Est. tokens: ${estimatedTokens}`);

    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "StudyShare Knowledge Platform",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      const status = openRouterResponse.status;
      
      // Log detailed error info
      console.error(`[Categorize API] OpenRouter API error (${status}):`, errorText);
      console.error(`[Categorize API] Payload was ${payloadSizeKB}KB for file: ${fileName}`);
      
      // For rate limits, include specific error info
      if (status === 429) {
        console.error("[Categorize API] Rate limit exceeded! Consider:");
        console.error("  - Reducing document size further");
        console.error("  - Adding delay between requests");
        console.error("  - Using a different model");
      }
      
      return NextResponse.json<ApiResponse<CategorizeResponse>>({
        success: true,
        data: defaultResponse,
      });
    }

    const responseData = await openRouterResponse.json();
    const responseText = responseData.choices?.[0]?.message?.content || "";
    
    console.log(`[Categorize API] Raw response: ${responseText.substring(0, 300)}...`);

    // Parse the JSON response
    let categorization: CategorizeResponse;
    try {
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
      categorization = JSON.parse(cleanJson);
      
      console.log(`[Categorize API] Parsed result:`, {
        subject: categorization.subject,
        language: categorization.language,
        documentType: categorization.documentType,
      });
    } catch {
      console.error("[Categorize API] Failed to parse response:", responseText);
      categorization = defaultResponse;
    }

    return NextResponse.json<ApiResponse<CategorizeResponse>>({
      success: true,
      data: categorization,
    });
  } catch (error) {
    console.error("[Categorize API] Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to categorize document" },
      { status: 500 },
    );
  }
}
