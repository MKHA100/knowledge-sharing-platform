import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type SentimentCategory = "positive" | "neutral" | "negative" | "inappropriate";

export interface ModerationResult {
  category: SentimentCategory;
  confidence: number; // 0-1
  reasoning: string;
  shouldAutoApprove: boolean;
}

/**
 * Analyzes a thank-you message using Google Gemini AI
 * and determines if it should be auto-approved or requires admin review
 */
export async function moderateThankYouMessage(
  message: string
): Promise<ModerationResult> {
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set - auto-approving all messages");
    return {
      category: "positive",
      confidence: 1.0,
      reasoning: "Auto-approved: AI moderation not configured (missing API key)",
      shouldAutoApprove: true,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a content moderation AI for a knowledge-sharing platform where students send thank-you messages to document uploaders. Your task is to analyze the sentiment and appropriateness of a thank-you message.

Analyze the following message and categorize it into ONE of these categories:

1. **positive**: Genuinely grateful, appreciative, encouraging messages (e.g., "Thank you so much for sharing this!", "This helped me a lot!", "You're a lifesaver!")

2. **neutral**: Polite but generic messages without strong emotion (e.g., "Thanks", "Noted", "Received")

3. **negative**: Contains criticism, frustration, disappointment, or passive-aggressive tone (e.g., "Thanks but this wasn't helpful", "You should have uploaded sooner", "Not what I expected")

4. **inappropriate**: Contains offensive language, threats, spam, harassment, profanity, sexual content, or completely unrelated content (e.g., advertisements, random text, insults)

**Important Guidelines:**
- Auto-approve: positive and neutral messages
- Admin review required: negative and inappropriate messages
- Be sensitive to cultural differences and language variations
- Consider the context of educational content sharing
- Grade strictly but fairly - when in doubt between categories, choose the more cautious one

**Message to analyze:**
"${message}"

**Response Format (JSON only, no markdown):**
{
  "category": "positive|neutral|negative|inappropriate",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this category was chosen (1-2 sentences)"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate response
    const validCategories: SentimentCategory[] = ["positive", "neutral", "negative", "inappropriate"];
    if (!validCategories.includes(parsed.category)) {
      throw new Error(`Invalid category: ${parsed.category}`);
    }

    if (typeof parsed.confidence !== "number" || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error(`Invalid confidence: ${parsed.confidence}`);
    }

    const shouldAutoApprove = parsed.category === "positive" || parsed.category === "neutral";

    return {
      category: parsed.category as SentimentCategory,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning || "No reasoning provided",
      shouldAutoApprove,
    };
  } catch (error) {
    console.error("AI moderation error:", error);
    
    // Fail-safe: auto-approve to avoid blocking users
    // In production, you might want to require manual review instead
    return {
      category: "positive",
      confidence: 0.7,
      reasoning: "Auto-approved: AI moderation failed (see logs for details)",
      shouldAutoApprove: true,
    };
  }
}
