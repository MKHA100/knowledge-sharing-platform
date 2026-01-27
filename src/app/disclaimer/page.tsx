"use client";

import React from "react";
import { SharedNavbar } from "@/components/shared-navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { AppProvider } from "@/lib/app-context";

export default function DisclaimerPage() {
  React.useEffect(() => {
    document.title = "Disclaimer | StudyShare";
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
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <h1 className="text-4xl font-bold text-gray-900">
              Disclaimer
            </h1>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                General Disclaimer
              </h2>
              <p className="text-gray-700 leading-relaxed">
                StudyShare is intended for personal and educational use only. Content is 
                sourced from publicly available platforms such as government websites, 
                gazettes, newspapers, social media, user contributions, and other online 
                sources. All copyrights remain with their original owners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Educational Purpose
              </h2>
              <p className="text-gray-700 leading-relaxed">
                All materials provided on StudyShare are intended solely for educational and 
                informational purposes. They are meant to assist O-Level students in Sri Lanka 
                with their studies and exam preparation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Content Accuracy
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                While we aim for accuracy and timely updates, we are not responsible for any 
                outdated, incomplete, or modified content in the original sources. This site is 
                independently maintained and is not affiliated with any official examination 
                body or educational institution.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
                <p className="text-sm text-gray-700">
                  <strong>Important:</strong> Users are encouraged to verify information before 
                  use. We do not guarantee the accuracy, completeness, or reliability of any content.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. User-Contributed Content
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                StudyShare allows users to upload and share educational materials. We implement 
                moderation and review processes, but:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We cannot verify the authenticity of all user-uploaded content</li>
                <li>Users are responsible for ensuring they have rights to share materials</li>
                <li>We are not liable for inaccuracies in user-contributed content</li>
                <li>Inappropriate content should be reported immediately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Copyright and Intellectual Property
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All materials, trademarks, and logos belong to their respective owners. We 
                respect intellectual property rights and operate under the following principles:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Content is shared for educational purposes under fair use principles</li>
                <li>We do not claim ownership of third-party content</li>
                <li>Copyright holders can request removal of their content</li>
                <li>We respond promptly to valid copyright infringement claims</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                If you believe your copyrighted work has been used inappropriately, please 
                contact us with details, and we will investigate and take appropriate action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. No Professional Advice
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The content on StudyShare does not constitute professional educational advice, 
                tutoring services, or official examination guidance. Users should consult with 
                qualified educators, teachers, or official examination authorities for 
                personalized advice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are not liable for any damages arising from your use of the website, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Reliance on information provided on the platform</li>
                <li>Technical issues, downtime, or data loss</li>
                <li>Third-party links or external resources</li>
                <li>User-contributed content that may be inaccurate</li>
                <li>Any academic outcomes resulting from using our materials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Third-Party Links
              </h2>
              <p className="text-gray-700 leading-relaxed">
                StudyShare may contain links to external websites. We are not responsible for 
                the content, accuracy, or privacy practices of these third-party sites. Links 
                are provided for convenience only and do not imply endorsement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. "As Is" Service
              </h2>
              <p className="text-gray-700 leading-relaxed">
                StudyShare provides content "as is" without warranties of any kind, either 
                express or implied. We do not warrant that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>The service will be uninterrupted or error-free</li>
                <li>Content will always be current or accurate</li>
                <li>Files will be free from viruses or harmful components</li>
                <li>The platform will meet your specific requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. No Affiliation
              </h2>
              <p className="text-gray-700 leading-relaxed">
                StudyShare is an independent platform and is not affiliated with, endorsed by, 
                or connected to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>Department of Examinations, Sri Lanka</li>
                <li>Ministry of Education, Sri Lanka</li>
                <li>Any government educational authority</li>
                <li>Any school, college, or educational institution</li>
                <li>Any examination board or curriculum authority</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Changes to Content
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify, update, or remove any content from the platform 
                without prior notice. This includes user-uploaded materials that violate our 
                terms or copyright policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Use at Your Own Risk
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By using StudyShare, you acknowledge that you do so at your own risk. You are 
                responsible for verifying the accuracy of information and for any decisions 
                made based on the content provided.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Jurisdiction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                This disclaimer is governed by the laws of Sri Lanka. Any disputes arising from 
                the use of StudyShare shall be subject to the exclusive jurisdiction of the 
                courts of Sri Lanka.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                For copyright concerns, content removal requests, or general inquiries, please 
                contact us through the platform's support channels. We aim to respond to all 
                legitimate requests within a reasonable timeframe.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-center text-gray-800 font-medium mb-2">
                By using StudyShare, you acknowledge that you have read, understood, and agree 
                to this disclaimer.
              </p>
              <p className="text-center text-sm text-gray-600">
                We are committed to supporting the educational success of Sri Lankan O-Level 
                students while respecting all intellectual property rights.
              </p>
            </div>
          </div>
        </div>
      </main>
      </div>
    </AppProvider>
  );
}
