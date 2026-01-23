import type { Metadata } from "next";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "Dashboard - StudyShare",
  description: "Manage your uploads, downloads, and notifications on StudyShare",
  robots: {
    index: false, // Dashboard pages should not be indexed
    follow: false,
  },
};

export default function DashboardLayout({
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
