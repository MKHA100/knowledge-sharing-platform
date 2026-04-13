/**
 * Enhanced Browse Page Metadata Generator
 * 
 * Add this to your browse page or subject pages for dynamic SEO metadata
 * that changes based on the filters/subject being viewed.
 */

import type { Metadata } from "next";

interface BrowsePageParams {
  subject?: string;
  subjectName?: string;
  type?: "paper" | "short_note" | "book";
  medium?: "sinhala" | "english" | "tamil";
  searchQuery?: string;
}

export function generateBrowseMetadata(params: BrowsePageParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";
  
  // Build dynamic title and description based on filters
  let title = "Browse Study Materials";
  let description = "Free O-Level study materials for Sri Lankan students";
  let keywords: string[] = [
    "O-Level", "study materials", "past papers", "Sri Lanka"
  ];

  // Subject-specific
  if (params.subject && params.subjectName) {
    title = `${params.subjectName} O-Level Materials`;
    description = `Free ${params.subjectName} O-Level past papers, notes, and textbooks. Download Sinhala, English, and Tamil medium materials.`;
    keywords.push(
      `${params.subjectName} past papers`,
      `${params.subjectName} notes`,
      `O-Level ${params.subjectName}`,
      `${params.subjectName.toLowerCase().replace(/\s+/g, "-")} o level sri lanka`
    );
  }

  // Type-specific
  if (params.type) {
    const typeLabels: Record<string, string> = {
      paper: "Past Papers",
      short_note: "Short Notes",
      book: "Textbooks"
    };
    
    title = params.subjectName 
      ? `${params.subjectName} O-Level ${typeLabels[params.type]}`
      : `O-Level ${typeLabels[params.type]}`;
    
    description = params.type === "paper"
      ? `Download free O-Level past examination papers${params.subjectName ? ` for ${params.subjectName}` : ""}. Practice with official GCE papers, school model papers, and provincial papers.`
      : params.type === "short_note"
      ? `Access free O-Level revision notes${params.subjectName ? ` for ${params.subjectName}` : ""}. Quick study guides and topic summaries for exam preparation.`
      : `Free O-Level textbooks${params.subjectName ? ` for ${params.subjectName}` : ""}. Download reference books and study guides.`;

    keywords.push(
      `o-level ${params.type}s`,
      `free ${params.type} download`,
      `o level ${params.type} sri lanka`
    );
  }

  // Medium-specific
  if (params.medium) {
    const mediumLabels: Record<string, string> = {
      sinhala: "Sinhala Medium",
      english: "English Medium",
      tamil: "Tamil Medium"
    };
    
    title = `${title} - ${mediumLabels[params.medium]}`;
    description += ` Available in ${mediumLabels[params.medium]}.`;
    
    if (params.medium === "sinhala") {
      keywords.push(
        "සාමාන්‍ය පෙළ පසුගිය විභාග ප්‍රශ්න",
        "සිංහල මාධ්‍ය අධ්‍යයන පොත්",
        "sinhala medium past papers"
      );
    } else if (params.medium === "tamil") {
      keywords.push(
        "தமிழ் வழி கடந்த கால வினாத்தாள்கள்",
        "tamil medium o level papers"
      );
    } else {
      keywords.push("english medium past papers", "o level english notes");
    }
  }

  // Search query
  if (params.searchQuery) {
    title = `"${params.searchQuery}" - StudyShare Search`;
    description = `Search results for "${params.searchQuery}" on StudyShare. Free O-Level study materials for Sri Lankan students.`;
  }

  // Add base keywords
  keywords.push(
    "GCE Ordinary Level",
    "O/L exam preparation",
    "Grade 10",
    "Grade 11",
    "free education resources sri lanka"
  );

  const canonicalUrl = params.subject
    ? `${baseUrl}/browse/${params.subject}${params.type ? `?type=${params.type}` : ""}${params.medium ? `${params.type ? "&" : "?"}lang=${params.medium}` : ""}`
    : `${baseUrl}/browse`;

  return {
    title: {
      default: title,
      template: "%s | StudyShare",
    },
    description,
    keywords: [...new Set(keywords)], // Remove duplicates
    openGraph: {
      title: `${title} | StudyShare`,
      description,
      url: canonicalUrl,
      siteName: "StudyShare",
      images: [{
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudyShare - Free O-Level Study Materials",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Example usage in a browse page:
 * 
 * export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
 *   return generateBrowseMetadata({
 *     subject: searchParams.subject,
 *     subjectName: getSubjectDisplayName(searchParams.subject),
 *     type: searchParams.type,
 *     medium: searchParams.lang,
 *   });
 * }
 */

export default generateBrowseMetadata;
