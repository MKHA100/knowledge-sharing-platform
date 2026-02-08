import { NextResponse } from "next/server";

/**
 * IndexNow API Endpoint
 * 
 * Notifies Bing (and participating search engines) immediately when new content
 * is available for indexing. This bypasses the normal crawl schedule and
 * gets your pages indexed within hours instead of weeks.
 * 
 * Usage: POST /api/indexnow with { url: "https://studyshare.space/browse/..." }
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL is from our domain
    const urlObj = new URL(url);
    const allowedDomains = ["studyshare.space", "www.studyshare.space"];
    
    if (!allowedDomains.includes(urlObj.hostname)) {
      return NextResponse.json(
        { error: "Invalid domain" },
        { status: 400 }
      );
    }

    const key = process.env.INDEXNOW_KEY || "studyshare-indexnow-key";
    const host = "studyshare.space";

    // Ping IndexNow API
    const indexNowResponse = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({
        host: host,
        key: key,
        urlList: [url],
      }),
    });

    // Also submit to Bing URL Submission API if key available
    if (process.env.BING_API_KEY) {
      try {
        await fetch(`https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${process.env.BING_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteUrl: "https://studyshare.space",
            urlList: [url],
          }),
        });
      } catch (bingError) {
        console.log("Bing API submission failed (non-critical):", bingError);
      }
    }

    if (indexNowResponse.ok) {
      return NextResponse.json({ 
        success: true, 
        message: "URL submitted for indexing",
        url: url 
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
    console.error("IndexNow API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
