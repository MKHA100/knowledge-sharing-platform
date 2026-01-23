import { NextResponse } from "next/server";
import { SUBJECTS } from "@/lib/constants/subjects";
import { subjectIdToSlug } from "@/lib/utils/url-params";

/**
 * LLMs.json endpoint for AI systems
 * 
 * Provides structured data about StudyShare for AI crawlers
 * following the llms.txt specification
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.lk";

  const data = {
    name: "StudyShare",
    description: "Free O-Level study materials for Sri Lankan students",
    url: baseUrl,
    
    // Platform capabilities
    features: [
      "Browse study materials by subject",
      "Download past papers, notes, and textbooks",
      "Materials in Sinhala, English, and Tamil",
      "Free access for all students",
      "Community-contributed content",
    ],
    
    // Document types available
    documentTypes: [
      { id: "book", name: "Textbooks & Books", description: "Educational textbooks and reference materials" },
      { id: "short_note", name: "Short Notes", description: "Concise study notes and summaries" },
      { id: "paper", name: "Past Papers", description: "O-Level examination papers and model papers" },
    ],
    
    // Available mediums/languages
    mediums: [
      { id: "sinhala", name: "Sinhala", nativeName: "සිංහල" },
      { id: "english", name: "English", nativeName: "English" },
      { id: "tamil", name: "Tamil", nativeName: "தமிழ்" },
    ],
    
    // All 52 subjects with URLs
    subjects: SUBJECTS.map((subject) => ({
      id: subject.id,
      name: subject.displayName,
      url: `${baseUrl}/browse/${subjectIdToSlug(subject.id)}`,
      searchTerms: subject.searchTerms,
    })),
    
    // Key pages
    pages: [
      { name: "Homepage", url: baseUrl, description: "Main landing page" },
      { name: "Browse", url: `${baseUrl}/browse`, description: "Browse all study materials" },
      { name: "FAQ", url: `${baseUrl}/faq`, description: "Frequently asked questions" },
    ],
    
    // Related resources
    resources: {
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      sitemap: `${baseUrl}/sitemap.xml`,
      robots: `${baseUrl}/robots.txt`,
    },
    
    // Metadata
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalSubjects: SUBJECTS.length,
      curriculum: "Sri Lankan O-Level (Ordinary Level)",
      targetAudience: "Sri Lankan secondary school students",
    },
  };

  return NextResponse.json(data, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
}
