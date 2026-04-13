import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

export const metadata: Metadata = {
  title: "Disclaimer | StudyShare",
  description: "Disclaimer for StudyShare - important information about our free O-Level study materials platform for Sri Lankan students.",
  alternates: {
    canonical: `${baseUrl}/disclaimer`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
