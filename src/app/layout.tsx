import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { PHProvider, PostHogPageview } from "@/lib/posthog/provider";
import {
  JsonLd,
  generateWebsiteSchema,
  generateOrganizationSchema,
} from "@/components/structured-data";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.lk";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "StudyShare - O-Level Study Materials for Sri Lankan Students",
    template: "%s | StudyShare",
  },
  description:
    "Share and download study materials, short notes, past papers, and books for O-Level students in Sri Lanka. Join our community of learners helping each other succeed.",
  keywords: [
    "O-Level",
    "Sri Lanka",
    "study materials",
    "past papers",
    "short notes",
    "O/L",
    "exam preparation",
    "free education",
    "Sinhala medium",
    "English medium",
    "Tamil medium",
  ],
  authors: [{ name: "StudyShare" }],
  creator: "StudyShare",
  publisher: "StudyShare",
  generator: "Next.js",
  applicationName: "StudyShare",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "StudyShare",
    title: "StudyShare - O-Level Study Materials for Sri Lankan Students",
    description:
      "Free O-Level study materials including past papers, short notes, and textbooks. Available in Sinhala, English, and Tamil.",
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
    title: "StudyShare - O-Level Study Materials",
    description:
      "Free O-Level study materials for Sri Lankan students. Past papers, notes, and textbooks in Sinhala, English, and Tamil.",
    images: ["/og-image.png"],
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
  alternates: {
    canonical: baseUrl,
  },
  // Add Google Search Console verification when available
  // verification: {
  //   google: "your-verification-code",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Structured Data for SEO */}
          <JsonLd data={generateWebsiteSchema(baseUrl)} />
          <JsonLd data={generateOrganizationSchema(baseUrl)} />
        </head>
        <PHProvider>
          <body
            className={`font-sans antialiased`}
            suppressHydrationWarning={true}
          >
            <Suspense fallback={null}>
              <PostHogPageview />
            </Suspense>
            {children}
            <Analytics />
          </body>
        </PHProvider>
      </html>
    </ClerkProvider>
  );
}
