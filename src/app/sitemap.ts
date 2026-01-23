import type { MetadataRoute } from "next";
import { getAllSubjectSlugs } from "@/lib/utils/url-params";

/**
 * Dynamic XML Sitemap for StudyShare
 * 
 * Generates sitemap entries for:
 * - Homepage (priority 1.0)
 * - Browse page (priority 0.9)
 * - All 52 subject pages (priority 0.8)
 * - FAQ page (priority 0.7)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.lk";
  const currentDate = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic subject pages (all 52 subjects)
  const subjectSlugs = getAllSubjectSlugs();
  const subjectPages: MetadataRoute.Sitemap = subjectSlugs.map((slug) => ({
    url: `${baseUrl}/browse/${slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...subjectPages];
}
