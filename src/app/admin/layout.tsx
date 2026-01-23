import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - StudyShare",
  description: "Admin dashboard for managing StudyShare content and users",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
