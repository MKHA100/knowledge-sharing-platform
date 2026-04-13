import { NextResponse } from "next/server";

/**
 * Batch IndexNow API Endpoint
 * 
 * Efficiently submits multiple URLs to IndexNow in a single request.
 * Use this when you want to notify search engines about multiple pages at once,
 * such as after a bulk upload or when updating multiple subjects.
 * 
 * Usage: POST /api/indexnow-batch with { urls: ["https://...", "https://..."] }
 */
export async function POST(request: Request) {
  try {
    const { urls } = await request.json();

    // Validate input
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "URLs array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (urls.length > 10000) {
      return NextResponse.json(
        { error: "Maximum 10,000 URLs allowed per request" },
        { status: 400 }
      );
    }

    // Validate all URLs
    const allowedDomains = ["studyshare.space", "www.studyshare.space"];
    const invalidUrls: string[] = [];
    
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        if (!allowedDomains.includes(urlObj.hostname)) {
          invalidUrls.push(url);
        }
      } catch {
        invalidUrls.push(url);
      }
    }

    if (invalidUrls.length > 0) {
      return NextResponse.json(
        { 
          error: "Invalid URLs detected", 
          invalidUrls,
          message: "All URLs must be from studyshare.space domain"
        },
        { status: 400 }
      );
    }

    const key = process.env.INDEXNOW_KEY || "studyshare-indexnow-key";
    const host = "studyshare.space";

    // Submit to IndexNow API
    const indexNowResponse = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({
        host: host,
        key: key,
        urlList: urls,
      }),
    });

    // Also submit to Bing URL Submission API if available
    if (process.env.BING_API_KEY) {
      try {
        await fetch(`https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${process.env.BING_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteUrl: "https://studyshare.space",
            urlList: urls.slice(0, 500), // Bing limit
          }),
        });
      } catch (bingError) {
        console.log("Bing API submission failed (non-critical):", bingError);
      }
    }

    if (indexNowResponse.ok) {
      return NextResponse.json({ 
        success: true, 
        message: "URLs submitted for indexing",
        submittedCount: urls.length,
        urls: urls.slice(0, 10) // Return first 10 for confirmation
      });
    } else {
      const errorText = await indexNowResponse.text();
      console.error("IndexNow error:", errorText);
      return NextResponse.json(
        { error: "IndexNow submission failed", details: errorText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Batch IndexNow API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
