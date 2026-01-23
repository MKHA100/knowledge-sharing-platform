import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

interface UploadTypePageProps {
  params: Promise<{ type: string }>;
}

const validTypes = ["book", "notes", "papers", "jumbled"];

/**
 * Generate static params for all upload types
 */
export async function generateStaticParams() {
  return validTypes.map((type) => ({ type }));
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({ params }: UploadTypePageProps): Promise<Metadata> {
  const { type } = await params;
  
  if (!validTypes.includes(type)) {
    return {
      title: "Upload - StudyShare",
    };
  }
  
  const titleMap: Record<string, string> = {
    book: "Upload Books",
    notes: "Upload Short Notes",
    papers: "Upload Papers",
    jumbled: "Upload Jumbled Documents",
  };
  
  return {
    title: `${titleMap[type]} - StudyShare`,
    description: `Upload ${titleMap[type].toLowerCase()} and share with thousands of O-Level students`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Dynamic Upload Type Page
 * 
 * Redirects to /upload with the type as a query parameter
 */
export default async function UploadTypePage({ params }: UploadTypePageProps) {
  const { type } = await params;
  
  // Validate the type
  if (!validTypes.includes(type)) {
    notFound();
  }
  
  // Redirect to /upload with type query parameter
  redirect(`/upload?type=${type}`);
}
