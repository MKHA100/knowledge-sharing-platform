import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseClientContent, BrowseLoadingSkeleton } from "./_components/browse-client-content";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

/**
 * Browse Page Metadata - Critical for SEO
 */
export const metadata: Metadata = {
  title: "Browse O-Level Study Materials - Free Past Papers, Notes & Books",
  description:
    "Browse and download free O-Level study materials including past papers, short notes, and textbooks for all 52 subjects. Available in Sinhala, English, and Tamil medium for Sri Lankan students.",
  keywords: [
    "O-Level study materials",
    "O-Level past papers",
    "free O-Level notes",
    "Sri Lanka O-Level",
    "GCE O Level papers",
    "O/L exam papers",
    "O-Level textbooks",
    "Sinhala medium past papers",
    "English medium notes",
    "Tamil medium materials",
    "free study materials Sri Lanka",
    "O-Level revision notes",
    "O-Level model papers",
    "Grade 11 past papers",
    "OL exam preparation",
  ],
  openGraph: {
    title: "Browse Free O-Level Study Materials | StudyShare",
    description:
      "Download free past papers, notes, and books for O-Level exams. All 52 subjects covered in Sinhala, English, and Tamil.",
    type: "website",
    url: `${baseUrl}/browse`,
    siteName: "StudyShare",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "StudyShare - Browse O-Level Study Materials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Free O-Level Study Materials",
    description:
      "Free past papers, notes, and textbooks for Sri Lankan O-Level students",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/browse`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Browse Page - All Subjects
 * 
 * This is the main browse page showing all documents.
 * Subject-specific views are handled by /browse/[subject]/page.tsx
 * 
 * URL Structure:
 * - /browse - All subjects
 * - /browse?type=paper - Filtered by type
 * - /browse?lang=sinhala - Filtered by language  
 * - /browse?sort=newest - Sorted
 * - /browse?q=mathematics - Search query
 * - /browse?doc=<uuid> - Document overlay
 */
export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseLoadingSkeleton />}>
      <BrowseClientContent subjectId={null} />
    </Suspense>
  );
}
