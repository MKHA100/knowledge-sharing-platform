import type { Metadata } from "next";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "Upload Study Material - StudyShare",
  description: "Share your study materials with thousands of O-Level students across Sri Lanka",
  robots: {
    index: false, // Upload pages should not be indexed
    follow: false,
  },
};

export default function UploadLayout({
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
