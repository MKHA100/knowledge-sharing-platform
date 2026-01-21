import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AICategorization,
  DocumentType,
  SubjectType,
  MediumType,
} from "@/types";
import { SUBJECT_IDS } from "@/lib/constants/subjects";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Build the subject list dynamically from constants
const SUBJECT_LIST = SUBJECT_IDS.map((id) => `"${id}"`).join(" | ");

const CATEGORIZATION_PROMPT = `You are a document categorization assistant for a Sri Lankan O-Level student study materials platform.

Analyze the provided document and return a JSON object with the following fields:

{
  "documentType": "book" | "short_note" | "paper",
  "subject": ${SUBJECT_LIST},
  "medium": "sinhala" | "english" | "tamil",
  "confidence": 0.0-1.0,
  "title": "suggested title based on content",
  "needsReview": true | false
}

Subject Reference (O-Level subjects):
- Religion: buddhism, catholicism, saivanery, christianity, islam
- Core: english, sinhala_language_literature, tamil_language_literature, mathematics, history, science
- Languages: second_language_sinhala, second_language_tamil, pali, sanskrit, french, german, hindi, japanese, arabic, korean, chinese, russian
- Business/Social: civic_education, business_accounting, geography, entrepreneurship
- Arts: music_oriental, music_western, music_carnatic, dancing_oriental, dancing_bharata, drama_theatre
- Literature: english_literary_texts, sinhala_literary_texts, tamil_literary_texts, arabic_literary_texts
- Technical: ict, agriculture_food_technology, aquatic_bioresources, art_crafts, home_economics, health_physical_education, communication_media, design_construction, design_mechanical, design_electrical_electronic

Rules:
- "medium" refers to the PRIMARY language the document is written in (most content)
- Having some English terms in a Sinhala document is normal - still classify as "sinhala"
- "paper" includes: past papers, unit tests, school papers, exam papers
- "short_note" includes: summaries, revision notes, handwritten notes
- "book" includes: textbooks, reference materials, comprehensive guides
- If confidence is below 0.7, set needsReview to true
- Match the subject as specifically as possible to one of the 52 O-Level subjects

Return ONLY the JSON object, no other text.`;

export async function categorizeDocument(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<AICategorization> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent([
      { text: CATEGORIZATION_PROMPT },
      {
        inlineData: {
          mimeType,
          data: fileBuffer.toString("base64"),
        },
      },
    ]);

    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      documentType: parsed.documentType as DocumentType,
      subject: parsed.subject as SubjectType,
      medium: parsed.medium as MediumType,
      confidence: parsed.confidence,
      title: parsed.title,
      needsReview: parsed.needsReview || parsed.confidence < 0.7,
    };
  } catch (error) {
    console.error("AI categorization failed:", error);

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
