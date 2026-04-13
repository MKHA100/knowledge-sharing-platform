import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

export const metadata: Metadata = {
  title: "Terms of Use | StudyShare",
  description: "Terms of use for StudyShare - the free O-Level study materials platform for Sri Lankan students.",
  alternates: {
    canonical: `${baseUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
