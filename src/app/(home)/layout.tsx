import type { Metadata } from "next";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

/**
 * Homepage-specific metadata
 * This layout provides enhanced SEO metadata for the landing page
 */
export const metadata: Metadata = {
  title: "StudyShare - Free O-Level Study Materials for Sri Lankan Students",
  description:
    "Share and download free study materials, short notes, past papers, and books for O-Level students in Sri Lanka. Join our community of learners helping each other succeed. Available in Sinhala, English, and Tamil.",
  keywords: [
    "O-Level",
    "O/L",
    "Sri Lanka",
    "study materials",
    "past papers",
    "short notes",
    "free education",
    "exam preparation",
    "Sinhala medium",
    "English medium",
    "Tamil medium",
    "GCE O Level",
    "Sri Lankan students",
    "free past papers",
    "O Level notes",
  ],
  openGraph: {
    type: "website",
    url: baseUrl,
    title: "StudyShare - Free O-Level Study Materials for Sri Lankan Students",
    description:
      "Download free O-Level past papers, notes, and textbooks. Community-driven study materials in Sinhala, English, and Tamil.",
    siteName: "StudyShare",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudyShare - Free O-Level Study Materials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyShare - Free O-Level Study Materials",
    description:
      "Free study materials for Sri Lankan O-Level students. Past papers, notes, and textbooks in all mediums.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <ToastProvider />
      {children}
    </AppProvider>
  );
}
