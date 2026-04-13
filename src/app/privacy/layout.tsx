import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

export const metadata: Metadata = {
  title: "Privacy Policy | StudyShare",
  description: "Privacy policy for StudyShare - learn how we protect your data on our free O-Level study materials platform.",
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
