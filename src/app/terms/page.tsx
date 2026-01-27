"use client";

import React from "react";
import { SharedNavbar } from "@/components/shared-navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppProvider } from "@/lib/app-context";

export default function TermsPage() {
  React.useEffect(() => {
    document.title = "Terms of Use | StudyShare";
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
            Terms of Use – StudyShare
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using StudyShare, you agree to comply with these Terms of Use. 
                If you do not agree, please do not use the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Use of Content
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The content on this website is for personal and educational use only. You may not 
                reproduce, distribute, or commercialize any materials without explicit permission 
                from the copyright owners.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Documents are shared by users for educational purposes</li>
                <li>Commercial use of materials is strictly prohibited</li>
                <li>Always respect original authors' intellectual property rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Intellectual Property
              </h2>
              <p className="text-gray-700 leading-relaxed">
                All materials, trademarks, and logos belong to their respective owners. 
                Unauthorized use is prohibited. When uploading content, you confirm that you 
                have the right to share the material or that it is publicly available educational content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. User Conduct
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Users must not use the website for any unlawful or harmful activities. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Uploading malicious or inappropriate content</li>
                <li>Impersonating others or providing false information</li>
                <li>Attempting to compromise the security of the platform</li>
                <li>Harassing or abusing other users or administrators</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Disclaimer of Warranty
              </h2>
              <p className="text-gray-700 leading-relaxed">
                StudyShare provides content "as is" without warranties of any kind. We do not 
                guarantee accuracy or completeness. While we strive to ensure quality, users 
                should verify information independently.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We are not liable for any damages arising from your use of the website. This 
                includes but is not limited to direct, indirect, incidental, or consequential damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. User Contributions
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By uploading content to StudyShare, you grant us a non-exclusive license to 
                display, distribute, and make the content available to other users for 
                educational purposes. You retain ownership of your content but allow us to 
                share it within the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Account Termination
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate user accounts that violate these 
                terms or engage in activities harmful to the platform or community.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Changes to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may revise these terms at any time. Continued use means acceptance of 
                updated terms. We will notify users of significant changes via the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Governing Law
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These terms are governed by the laws of Sri Lanka. Any disputes shall be 
                resolved in accordance with Sri Lankan jurisdiction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these terms, please contact us through our support channels.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              By using StudyShare, you acknowledge that you have read and understood these terms.
            </p>
          </div>
        </div>
      </main>
      </div>
    </AppProvider>
  );
}
