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
 * - Filter combinations for SEO (priority 0.6)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";
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

  // Filter combination pages for SEO (high-value landing pages)
  const filterPages: MetadataRoute.Sitemap = [
    // By document type
    { url: `${baseUrl}/browse?type=paper`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/browse?type=short_note`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/browse?type=book`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 0.8 },
    // By medium/language
    { url: `${baseUrl}/browse?lang=sinhala`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/browse?lang=english`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/browse?lang=tamil`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 0.7 },
  ];

  // Popular subject + type combinations
  const popularCombinations: MetadataRoute.Sitemap = [
    "mathematics", "science", "english", "history", "buddhism", "ict"
  ].flatMap((subject) => [
    { url: `${baseUrl}/browse/${subject}?type=paper`, lastModified: currentDate, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/browse/${subject}?type=short_note`, lastModified: currentDate, changeFrequency: "weekly" as const, priority: 0.7 },
  ]);

  return [...staticPages, ...subjectPages, ...filterPages, ...popularCombinations];
}
