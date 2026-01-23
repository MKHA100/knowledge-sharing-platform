import type { Metadata } from "next";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "Browse Documents - StudyShare",
  description:
    "Browse and download O-Level study materials including past papers, short notes, and textbooks for Sri Lankan students. Available in Sinhala, English, and Tamil.",
  keywords: [
    "O Level past papers",
    "O Level notes",
    "Sri Lanka education",
    "study materials",
    "exam preparation",
    "O Level books",
  ],
  openGraph: {
    title: "Browse Documents - StudyShare",
    description:
      "Browse and download O-Level study materials for Sri Lankan students",
    type: "website",
  },
};

export default function BrowseLayout({
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
