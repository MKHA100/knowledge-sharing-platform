import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { PHProvider, PostHogPageview } from "@/lib/posthog/provider";
import {
  JsonLd,
  generateWebsiteSchema,
  generateOrganizationSchema,
} from "@/components/structured-data";
import "./globals.css";

const _geist = Geist({ 
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});
const _geistMono = Geist_Mono({ 
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "StudyShare - Free O-Level Study Materials for Sri Lankan Students",
    template: "%s | StudyShare",
  },
  description:
    "Download free O-Level past papers, short notes, and textbooks for Sri Lankan students. All 52 subjects covered in Sinhala, English, and Tamil medium. Join our community of learners today!",
  keywords: [
    // Primary keywords
    "O-Level",
    "O Level",
    "O/L",
    "Sri Lanka",
    "study materials",
    "past papers",
    "short notes",
    "free education",
    // Long-tail keywords
    "O-Level past papers free download",
    "Sri Lanka O Level notes",
    "GCE Ordinary Level papers",
    "O/L exam preparation",
    "free O Level study materials",
    "O-Level revision notes",
    "O-Level model papers",
    // Subject-specific
    "O Level Mathematics past papers",
    "O Level Science notes",
    "O Level English past papers",
    // Medium-specific
    "Sinhala medium past papers",
    "English medium O Level notes",
    "Tamil medium study materials",
    // Local variations
    "Grade 10 past papers Sri Lanka",
    "Grade 11 exam papers",
    "OL papers download",
    "සාමාන්‍ය පෙළ පසුගිය විභාග ප්‍රශ්න",
  ],
  authors: [{ name: "StudyShare" }],
  creator: "StudyShare",
  publisher: "StudyShare",
  generator: "Next.js",
  applicationName: "StudyShare",
  referrer: "origin-when-cross-origin",
  category: "Education",
  classification: "Educational Resources",
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
  // Search Console Verification
  // Add your verification codes from Google/Bing after registering
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
    },
  },
  other: {
    // Additional SEO hints
    "google-site-verification": process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
    "theme-color": "#3b82f6",
  },
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
          {/* Resource Hints for Performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://us.i.posthog.com" />
          <link rel="dns-prefetch" href="https://accounts.dev" />
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ""} />
          <link rel="dns-prefetch" href={process.env.R2_PUBLIC_URL || ""} />
          
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
            <Analytics mode="production" />
            <SpeedInsights />
          </body>
        </PHProvider>
      </html>
    </ClerkProvider>
  );
}
