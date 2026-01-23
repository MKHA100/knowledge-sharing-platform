import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration for StudyShare
 * 
 * Allows crawlers on public pages (browse, subjects, FAQ)
 * Blocks admin, dashboard, upload, auth, and API routes
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.lk";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/browse/*", "/faq"],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/upload",
          "/upload/*",
          "/sign-in",
          "/sign-in/*",
          "/sign-up",
          "/sign-up/*",
          "/api",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
