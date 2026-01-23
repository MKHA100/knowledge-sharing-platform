import React from "react";

/**
 * JSON-LD Structured Data Components for SEO
 * 
 * These components render schema.org structured data
 * to help search engines and AI systems understand the content.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Generic JSON-LD component
 * Renders a script tag with structured data
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * WebSite Schema
 * Used on homepage for site-wide search and identity
 */
export function generateWebsiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StudyShare",
    alternateName: "StudyShare Sri Lanka",
    url: baseUrl,
    description: "Free O-Level study materials for Sri Lankan students",
    inLanguage: ["en", "si", "ta"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/browse?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Organization Schema
 * Establishes brand identity
 */
export function generateOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "StudyShare",
    url: baseUrl,
    logo: `${baseUrl}/icon-512.png`,
    description: "A community-driven platform for sharing O-Level study materials in Sri Lanka",
    areaServed: {
      "@type": "Country",
      name: "Sri Lanka",
    },
    serviceType: "Educational Resource Sharing",
  };
}

/**
 * FAQ Page Schema
 * Used for FAQ pages to enable rich results
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Course/Subject Schema
 * Used for individual subject pages
 */
export function generateSubjectSchema(
  baseUrl: string,
  subjectName: string,
  subjectSlug: string,
  description: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${subjectName} - O-Level Study Materials`,
    description: description,
    url: `${baseUrl}/browse/${subjectSlug}`,
    provider: {
      "@type": "EducationalOrganization",
      name: "StudyShare",
      url: baseUrl,
    },
    educationalLevel: "O-Level (Ordinary Level)",
    inLanguage: ["en", "si", "ta"],
    isAccessibleForFree: true,
    coursePrerequisites: "None",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "Self-paced",
    },
  };
}

/**
 * Breadcrumb Schema
 * Used for navigation hierarchy
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Learning Resource Schema
 * Used for individual documents (optional future use)
 */
export function generateLearningResourceSchema(
  baseUrl: string,
  title: string,
  description: string,
  subject: string,
  documentType: "Book" | "Article" | "Quiz",
  url: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title,
    description: description,
    url: url,
    learningResourceType: documentType,
    educationalLevel: "O-Level",
    about: {
      "@type": "Thing",
      name: subject,
    },
    provider: {
      "@type": "EducationalOrganization",
      name: "StudyShare",
      url: baseUrl,
    },
    isAccessibleForFree: true,
    inLanguage: ["en", "si", "ta"],
  };
}

/**
 * Combined schemas for homepage
 */
export function generateHomepageSchemas(baseUrl: string) {
  return [
    generateWebsiteSchema(baseUrl),
    generateOrganizationSchema(baseUrl),
  ];
}

/**
 * Component that renders multiple schemas
 */
export function MultipleJsonLd({ schemas }: { schemas: Record<string, unknown>[] }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
    </>
  );
}
