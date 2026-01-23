import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BrowseClientContent, BrowseLoadingSkeleton } from "../_components/browse-client-content";
import { 
  slugToSubjectId, 
  getAllSubjectSlugs,
  isValidSubjectSlug,
  subjectIdToSlug
} from "@/lib/utils/url-params";
import { getSubjectDisplayName } from "@/lib/constants/subjects";
import {
  JsonLd,
  generateSubjectSchema,
  generateBreadcrumbSchema,
} from "@/components/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.lk";

interface SubjectPageProps {
  params: Promise<{ subject: string }>;
}

/**
 * Generate static params for all 52 subjects
 * This enables static generation at build time
 */
export async function generateStaticParams() {
  const slugs = getAllSubjectSlugs();
  return slugs.map((subject) => ({ subject }));
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { subject: slug } = await params;
  const subjectId = slugToSubjectId(slug);
  
  if (!subjectId) {
    return {
      title: "Subject Not Found - StudyShare",
    };
  }
  
  const displayName = getSubjectDisplayName(subjectId);
  
  return {
    title: `${displayName} - O Level Study Materials | StudyShare`,
    description: `Download free ${displayName} O-Level past papers, short notes, and textbooks for Sri Lankan students. Available in Sinhala, English, and Tamil.`,
    keywords: [
      displayName,
      `${displayName} O Level`,
      `${displayName} past papers`,
      `${displayName} notes`,
      "Sri Lanka O Level",
      "free study materials",
    ],
    openGraph: {
      title: `${displayName} Study Materials - StudyShare`,
      description: `Browse and download ${displayName} O-Level study materials for Sri Lankan students`,
      type: "website",
    },
  };
}

/**
 * Subject-specific Browse Page
 * 
 * Dynamic route that renders documents filtered by subject.
 * URLs like /browse/mathematics, /browse/science, etc.
 */
export default async function SubjectBrowsePage({ params }: SubjectPageProps) {
  const { subject: slug } = await params;
  
  // Validate the subject slug
  if (!isValidSubjectSlug(slug)) {
    notFound();
  }
  
  const subjectId = slugToSubjectId(slug);
  
  if (!subjectId) {
    notFound();
  }

  const displayName = getSubjectDisplayName(subjectId);
  const description = `Download free ${displayName} O-Level past papers, short notes, and textbooks for Sri Lankan students. Available in Sinhala, English, and Tamil.`;
  
  // Generate structured data for SEO
  const subjectSchema = generateSubjectSchema(baseUrl, displayName, slug, description);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Browse", url: `${baseUrl}/browse` },
    { name: displayName, url: `${baseUrl}/browse/${slug}` },
  ]);
  
  return (
    <>
      {/* Structured Data */}
      <JsonLd data={subjectSchema} />
      <JsonLd data={breadcrumbSchema} />
      
      <Suspense fallback={<BrowseLoadingSkeleton />}>
        <BrowseClientContent subjectId={subjectId} />
      </Suspense>
    </>
  );
}
