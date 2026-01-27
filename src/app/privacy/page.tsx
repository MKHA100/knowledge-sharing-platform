"use client";

import React from "react";
import { SharedNavbar } from "@/components/shared-navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppProvider } from "@/lib/app-context";

export default function PrivacyPage() {
  React.useEffect(() => {
    document.title = "Privacy Policy | StudyShare";
  }, []);
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <SharedNavbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy – StudyShare
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                StudyShare ("we," "us," or "our") respects your privacy and is committed to 
                protecting your personal information. This Privacy Policy explains how we collect, 
                use, and safeguard your data when you visit our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Information We Collect
              </h2>
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Personal Information
                </h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  We do not collect personal information unless you voluntarily provide it 
                  (e.g., via contact forms, newsletters, or account registration):
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Name and email address (when you create an account)</li>
                  <li>Profile information you choose to share</li>
                  <li>Content you upload (documents, comments, feedback)</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Non-Personal Information
                </h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  We may collect technical data such as IP addresses, browser type, device 
                  information, and website usage through cookies and analytics tools:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Pages visited and time spent on the site</li>
                  <li>Referring website and search terms used</li>
                  <li>Device and browser characteristics</li>
                  <li>Anonymous usage patterns for analytics</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Use of Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process document uploads and manage user accounts</li>
                <li>Communicate with you if you contact us</li>
                <li>Analyze website traffic and improve user experience</li>
                <li>Detect and prevent fraudulent activity</li>
                <li>Send important updates about the platform (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our website may use cookies and similar tracking technologies to enhance user 
                experience. You can control cookie preferences via your browser settings.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="text-sm text-gray-700">
                  <strong>Cookie Types:</strong> Essential cookies (required for site functionality), 
                  Analytics cookies (understand user behavior), and Performance cookies (improve site speed).
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data Sharing
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. 
                We may share data with service providers who assist in operating the website 
                under strict confidentiality:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Authentication services (Clerk) for secure login</li>
                <li>Cloud storage providers (Cloudflare R2) for file hosting</li>
                <li>Analytics platforms (PostHog, Vercel) to understand usage patterns</li>
                <li>Database services (Supabase) for data management</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                All third-party services are bound by their own privacy policies and security measures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We implement reasonable security measures to protect your data but cannot 
                guarantee absolute security. We use industry-standard encryption, secure 
                authentication, and regular security audits to safeguard your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Your Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to access, correct, or delete your personal data held by us. 
                To exercise these rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> View what data we have about you</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request removal of your data (subject to legal obligations)</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Contact us through the platform to submit any data-related requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                StudyShare is designed for O-Level students and educational use. While we welcome 
                students of all ages, we do not knowingly collect personal information from 
                children under 13 without parental consent. If you believe a child has provided 
                personal information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Third-Party Links
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Our website may contain links to external sites. We are not responsible for 
                the privacy practices of these third-party websites. Please review their 
                privacy policies before providing any information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy occasionally. The latest version will always 
                be posted on this page with the effective date. We encourage you to review 
                this policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. International Users
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you are accessing StudyShare from outside Sri Lanka, please be aware that 
                your information may be transferred to and processed in servers located in 
                different countries. By using our service, you consent to such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions or concerns about this Privacy Policy or how we handle 
                your data, please contact us through the platform's support channels.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Your privacy is important to us. We are committed to protecting your information.
            </p>
          </div>
        </div>
      </main>
      </div>
    </AppProvider>
  );
}
