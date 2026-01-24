import { callOpenRouterWithImage, VISION_MODEL } from "./openrouter-client";
import type {
  AICategorization,
  DocumentType,
  SubjectType,
  MediumType,
} from "@/types";
import { SUBJECT_IDS } from "@/lib/constants/subjects";

// Build the subject list dynamically from constants
const SUBJECT_LIST = SUBJECT_IDS.map((id) => `"${id}"`).join(" | ");

const CATEGORIZATION_PROMPT = `You are a document categorization assistant for a Sri Lankan O-Level student study materials platform.

IMPORTANT: Carefully analyze the actual content and language of the document. Do NOT default to English or Mathematics unless the document is truly in English or about Mathematics.

Analyze the provided document image and return a JSON object with the following fields:

{
  "documentType": "book" | "short_note" | "paper",
  "subject": ${SUBJECT_LIST},
  "medium": "sinhala" | "english" | "tamil",
  "confidence": 0.0-1.0,
  "title": "suggested title based on content",
  "needsReview": true | false
}

CRITICAL RULES for medium detection:
- Look at the ACTUAL TEXT in the document image
- If the text uses Sinhala script (සිංහල), set medium to "sinhala"
- If the text uses Tamil script (தமிழ்), set medium to "tamil"  
- Only set medium to "english" if the document is primarily written in English
- Having English terms/headings in a Sinhala/Tamil document is normal - classify by the PRIMARY language

Subject Reference (O-Level subjects):
- Religion: buddhism, catholicism, saivanery, christianity, islam
- Core: english, sinhala_language_literature, tamil_language_literature, mathematics, history, science
- Languages: second_language_sinhala, second_language_tamil, pali, sanskrit, french, german, hindi, japanese, arabic, korean, chinese, russian
- Business/Social: civic_education, business_accounting, geography, entrepreneurship
- Arts: music_oriental, music_western, music_carnatic, dancing_oriental, dancing_bharata, drama_theatre
- Literature: english_literary_texts, sinhala_literary_texts, tamil_literary_texts, arabic_literary_texts
- Technical: ict, agriculture_food_technology, aquatic_bioresources, art_crafts, home_economics, health_physical_education, communication_media, design_construction, design_mechanical, design_electrical_electronic

Document type rules:
- "paper" includes: past papers, unit tests, school papers, exam papers, question papers
- "short_note" includes: summaries, revision notes, handwritten notes, mind maps
- "book" includes: textbooks, reference materials, comprehensive guides, chapters

If confidence is below 0.7, set needsReview to true.

Return ONLY the JSON object, no other text or markdown.`;

export async function categorizeDocument(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<AICategorization> {
  try {
    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("[AI Categorization] OPENROUTER_API_KEY not set - returning default categorization");
      return {
        documentType: "short_note",
        subject: "mathematics",
        medium: "english",
        confidence: 0,
        title: "Untitled Document",
        needsReview: true,
      };
    }

    console.log(`[AI Categorization] Processing document with MIME type: ${mimeType}`);
    console.log(`[AI Categorization] Using vision model: ${VISION_MODEL}`);

    const response = await callOpenRouterWithImage(
      CATEGORIZATION_PROMPT,
      fileBuffer.toString("base64"),
      mimeType,
      {
        temperature: 0.2,
        maxTokens: 512,
      }
    );

    console.log(`[AI Categorization] Raw response: ${response.substring(0, 200)}...`);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI Categorization] No JSON found in response:", response);
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log(`[AI Categorization] Parsed result:`, {
      documentType: parsed.documentType,
      subject: parsed.subject,
      medium: parsed.medium,
      confidence: parsed.confidence,
      title: parsed.title,
    });

    // Validate the response
    const validDocTypes = ["book", "short_note", "paper"];
    const validMediums = ["sinhala", "english", "tamil"];
    
    if (!validDocTypes.includes(parsed.documentType)) {
      console.warn(`[AI Categorization] Invalid documentType: ${parsed.documentType}, defaulting to short_note`);
      parsed.documentType = "short_note";
      parsed.needsReview = true;
    }
    
    if (!validMediums.includes(parsed.medium)) {
      console.warn(`[AI Categorization] Invalid medium: ${parsed.medium}, defaulting to english`);
      parsed.medium = "english";
      parsed.needsReview = true;
    }

    return {
      documentType: parsed.documentType as DocumentType,
      subject: parsed.subject as SubjectType,
      medium: parsed.medium as MediumType,
      confidence: parsed.confidence,
      title: parsed.title,
      needsReview: parsed.needsReview || parsed.confidence < 0.7,
    };
  } catch (error) {
    console.error("[AI Categorization] Failed:", error);

    // Return default with review flag
    return {
      documentType: "short_note",
      subject: "mathematics",
      medium: "english",
      confidence: 0,
      title: "Untitled Document",
      needsReview: true,
    };
  }
}

export async function detectDuplicateContent(
  newFileBuffer: Buffer,
  existingDocuments: { id: string; title: string }[],
): Promise<{
  isDuplicate: boolean;
  matchedDocumentId?: string;
  confidence: number;
}> {
  // Simple hash-based duplicate detection
  const crypto = await import("crypto");
  const newHash = crypto.createHash("md5").update(newFileBuffer).digest("hex");

  // For now, return no duplicate - full implementation would compare hashes stored in DB
  // This is a placeholder for the hash comparison logic
  return {
    isDuplicate: false,
    confidence: 0,
  };
}
