import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration for StudyShare
 * 
 * Allows crawlers on public pages (browse, subjects, FAQ)
 * Blocks admin, dashboard, upload, auth, and API routes
 * Includes special rules for AI crawlers and Bing
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

  return {
    rules: [
      // Main rule for all crawlers
      {
        userAgent: "*",
        allow: [
          "/",
          "/browse",
          "/browse/*",
          "/faq",
          "/llms.txt",
          "/llms-full.txt",
          "/llms.json",
          "/.well-known/*",
        ],
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
          "/_next/*",
          "/private/*",
        ],
      },
      // Specific rules for Googlebot
      {
        userAgent: "Googlebot",
        allow: ["/", "/browse", "/browse/*", "/faq"],
        disallow: ["/admin", "/dashboard", "/upload", "/api", "/sign-in", "/sign-up"],
      },
      // Specific rules for Bingbot (important for Bing, Copilot, Perplexity)
      {
        userAgent: "Bingbot",
        allow: ["/", "/browse", "/browse/*", "/faq", "/llms.txt"],
        disallow: ["/admin", "/dashboard", "/upload", "/api"],
      },
      // AI crawlers - allow full access to documentation
      {
        userAgent: "GPTBot",
        allow: ["/", "/browse", "/browse/*", "/faq", "/llms.txt", "/llms-full.txt", "/llms.json"],
        disallow: ["/admin", "/dashboard", "/upload"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/browse", "/browse/*", "/faq", "/llms.txt", "/llms-full.txt", "/llms.json"],
        disallow: ["/admin", "/dashboard", "/upload"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/browse", "/browse/*", "/faq", "/llms.txt", "/llms-full.txt", "/llms.json"],
        disallow: ["/admin", "/dashboard", "/upload"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/browse", "/browse/*", "/faq", "/llms.txt", "/llms-full.txt", "/llms.json"],
        disallow: ["/admin", "/dashboard", "/upload"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/browse", "/browse/*", "/faq", "/llms.txt", "/llms-full.txt", "/llms.json"],
        disallow: ["/admin", "/dashboard", "/upload"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
