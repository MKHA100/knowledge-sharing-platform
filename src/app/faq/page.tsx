import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, generateFAQSchema, type FAQItem } from "@/components/structured-data";
import { SharedNavbar } from "@/components/shared-navbar";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyshare.space";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about StudyShare - the free O-Level study materials platform for Sri Lankan students.",
  keywords: [
    "StudyShare FAQ",
    "O-Level questions",
    "study materials help",
    "Sri Lanka education",
    "free past papers",
  ],
  openGraph: {
    title: "FAQ - StudyShare",
    description: "Common questions about StudyShare and O-Level study materials",
    type: "website",
    url: `${baseUrl}/faq`,
  },
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
};

// FAQ data - structured for both display and schema generation
const faqs: FAQItem[] = [
  {
    question: "What is StudyShare?",
    answer:
      "StudyShare is a free community-driven platform where Sri Lankan students can share and download O-Level (Ordinary Level) study materials. Our platform hosts past papers, short notes, and textbooks contributed by students and teachers across the country.",
  },
  {
    question: "Are all the study materials free to download?",
    answer:
      "Yes, all study materials on StudyShare are completely free. We believe education should be accessible to everyone. You can download unlimited past papers, notes, and books without any payment or subscription.",
  },
  {
    question: "What subjects are available on StudyShare?",
    answer:
      "We cover all 52 subjects in the Sri Lankan O-Level curriculum. This includes core subjects like Mathematics, Science, English, Sinhala, and History, as well as specialized subjects in Commerce, Arts, Technology, and Languages. Browse our subjects page to see the complete list.",
  },
  {
    question: "In what languages are materials available?",
    answer:
      "Study materials are available in all three mediums used in Sri Lankan schools: Sinhala (සිංහල), English, and Tamil (தமிழ்). You can filter materials by your preferred medium when browsing.",
  },
  {
    question: "How do I download study materials?",
    answer:
      "Simply browse or search for the materials you need, then click the download button. For some features, you may need to create a free account. Creating an account also lets you track your downloads and contribute your own materials.",
  },
  {
    question: "Can I upload my own study notes?",
    answer:
      "Yes! Registered users can contribute their own study materials to help fellow students. Your notes, summaries, and past paper solutions can help thousands of students across Sri Lanka. All uploads are reviewed for quality before being published.",
  },
  {
    question: "Are these official O-Level past papers?",
    answer:
      "Our collection includes both official O-Level examination papers from past years and high-quality model papers. Each document is labeled to indicate whether it's an official past paper or a model/practice paper.",
  },
  {
    question: "How do I search for specific topics?",
    answer:
      "Use the search bar at the top of the browse page to find materials by keyword. You can also filter by subject, document type (past papers, notes, books), and medium (Sinhala, English, Tamil) to narrow down your results.",
  },
  {
    question: "What file format are the documents in?",
    answer:
      "Most documents are available as PDF files, which can be viewed on any device and printed easily. PDFs maintain their formatting across different devices and are universally accessible.",
  },
  {
    question: "How do I report incorrect or inappropriate content?",
    answer:
      "If you find any content that is incorrect, inappropriate, or violates copyright, please use the feedback form on our homepage to report it. Our team reviews all reports and takes appropriate action.",
  },
  {
    question: "Do I need to create an account to use StudyShare?",
    answer:
      "You can browse and view materials without an account. However, creating a free account gives you additional features like downloading materials, tracking your activity, saving favorites, and uploading your own study materials.",
  },
  {
    question: "Is StudyShare affiliated with the Sri Lankan government or education ministry?",
    answer:
      "No, StudyShare is an independent community platform created by students for students. We are not officially affiliated with the Ministry of Education or the Department of Examinations, though our materials are aligned with the official O-Level curriculum.",
  },
  {
    question: "How can I help improve StudyShare?",
    answer:
      "There are several ways to contribute: upload your own study materials, provide feedback through our contact form, share StudyShare with fellow students, and help us identify any errors or improvements needed. Every contribution helps the student community.",
  },
  {
    question: "What devices can I use to access StudyShare?",
    answer:
      "StudyShare works on any device with a web browser - computers, laptops, tablets, and smartphones. Our website is fully responsive and optimized for mobile viewing, so you can study anywhere.",
  },
  {
    question: "How often is new content added?",
    answer:
      "New materials are added regularly by our community of contributors. After major examinations, you can expect to see new past papers uploaded. Check back frequently or follow our updates to see the latest materials.",
  },
];

export default function FAQPage() {
  return (
    <AppProvider>
      <ToastProvider />
      {/* FAQ Schema for Rich Results */}
      <JsonLd data={generateFAQSchema(faqs)} />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <SharedNavbar />

        {/* Main Content */}
        <main className="container mx-auto px-4 pt-32 pb-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about using StudyShare for your O-Level exam preparation.
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <article key={index} className="border-b border-gray-200 pb-8 last:border-0">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-slate-100 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can&apos;t find what you&apos;re looking for? Send us a message through our feedback form.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button>Go to Homepage</Button>
              </Link>
              <Link href="/browse">
                <Button variant="outline">Browse Materials</Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-gray-50 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500">
            <p>© {new Date().getFullYear()} StudyShare. Free O-Level study materials for Sri Lankan students.</p>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}