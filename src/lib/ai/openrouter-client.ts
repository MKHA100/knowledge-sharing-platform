/**
 * OpenRouter API Client
 * 
 * This client interfaces with OpenRouter for AI-powered features:
 * - Text moderation: google/gemma-3-27b-it:free (text-only, free)
 * - Document categorization: google/gemini-2.0-flash-exp:free (vision, free)
 */

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
}

interface OpenRouterContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Text-only model for message moderation
// Using free tier since text moderation has good rate limits
export const TEXT_MODEL = "google/gemma-3-27b-it:free";

// Vision model for document categorization (paid - uses your credits)
// Using paid version for dedicated rate limits (not shared with free users)
export const VISION_MODEL = "google/gemini-2.0-flash-exp";

/**
 * Call the OpenRouter API with a text prompt
 */
export async function callOpenRouter(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "StudyShare Knowledge Platform",
    },
    body: JSON.stringify({
      model: options?.model || TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenRouter API");
  }

  return data.choices[0].message.content;
}

/**
 * Call the OpenRouter API with an image (for document categorization)
 */
export async function callOpenRouterWithImage(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  // Convert image to data URL format required by OpenRouter
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  // Use vision model for image processing
  const model = options?.model || VISION_MODEL;
  
  console.log(`[OpenRouter] Using vision model: ${model} for document categorization`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "StudyShare Knowledge Platform",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenRouter API");
  }

  return data.choices[0].message.content;
}
