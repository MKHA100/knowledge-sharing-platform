/**
 * Upload Success Handler with IndexNow Integration
 * 
 * This file shows how to modify your existing upload success handler
 * to automatically notify search engines when new content is available.
 * 
 * Add this code to your upload completion handler (e.g., in your upload page or API)
 */

// Example: Add to your upload success handler
async function handleUploadSuccess(
  uploadedDocument: {
    id: string;
    subject: string;
    subjectSlug: string;
    type: "paper" | "short_note" | "book";
    medium: "sinhala" | "english" | "tamil";
    year?: number;
  }
) {
  // Your existing success handling code here...
  // e.g., show toast, redirect, etc.

  // NEW: Notify search engines about the new content
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";
    
    // URLs to notify search engines about
    const urlsToIndex = [
      // The specific subject page that now has new content
      `${baseUrl}/browse/${uploadedDocument.subjectSlug}`,
      
      // The main browse page (shows recent uploads)
      `${baseUrl}/browse`,
      
      // Filter pages that include this document
      `${baseUrl}/browse?type=${uploadedDocument.type}`,
      `${baseUrl}/browse?lang=${uploadedDocument.medium}`,
      `${baseUrl}/browse/${uploadedDocument.subjectSlug}?type=${uploadedDocument.type}`,
    ];

    // Ping IndexNow for each URL
    const indexPromises = urlsToIndex.map(url => 
      fetch("/api/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).catch(err => {
        // Silently fail - indexing notification is non-critical
        console.log(`IndexNow ping failed for ${url}:`, err);
      })
    );

    // Fire and forget - don't block the user
    Promise.all(indexPromises);

    console.log(`🔔 Notified search engines about new ${uploadedDocument.type} in ${uploadedDocument.subject}`);
    
  } catch (error) {
    // Silently log - don't show error to user
    console.log("Search engine notification failed (non-critical):", error);
  }
}

// Alternative: If you want to batch notifications (more efficient)
async function handleMultipleUploads(
  uploadedDocuments: Array<{
    subjectSlug: string;
    type: string;
    medium: string;
  }>
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";
  
  // Collect unique URLs only
  const uniqueUrls = new Set<string>();
  
  uploadedDocuments.forEach(doc => {
    uniqueUrls.add(`${baseUrl}/browse/${doc.subjectSlug}`);
    uniqueUrls.add(`${baseUrl}/browse?type=${doc.type}`);
    uniqueUrls.add(`${baseUrl}/browse?lang=${doc.medium}`);
  });

  // Always include main browse page
  uniqueUrls.add(`${baseUrl}/browse`);

  // Submit all URLs
  const urlList = Array.from(uniqueUrls);
  
  try {
    const response = await fetch("/api/indexnow-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: urlList }),
    });

    if (response.ok) {
      console.log(`🔔 Notified search engines about ${urlList.length} updated pages`);
    }
  } catch (error) {
    console.log("Batch indexing notification failed:", error);
  }
}

// Optional: Add a batch IndexNow endpoint for efficiency
// Create: src/app/api/indexnow-batch/route.ts
/*
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs array required" }, { status: 400 });
    }

    const key = process.env.INDEXNOW_KEY || "studyshare-indexnow-key";
    const host = "studyshare.space";

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: host,
        key: key,
        urlList: urls.slice(0, 10000), // IndexNow limit
      }),
    });

    return NextResponse.json({ 
      success: response.ok,
      submittedCount: urls.length 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
*/

export { handleUploadSuccess, handleMultipleUploads };
