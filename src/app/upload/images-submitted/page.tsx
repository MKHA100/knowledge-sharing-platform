"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, FileSearch, FileCheck, Bell, ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedNavbar } from "@/components/shared-navbar";

function ImagesSubmittedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    const count = searchParams.get("count");
    if (count) {
      setImageCount(parseInt(count, 10));
    } else {
      // If no count provided, redirect back to upload
      router.push("/upload");
    }
  }, [searchParams, router]);

  if (imageCount === 0) {
    return null; // Loading or redirecting
  }

  const timelineSteps = [
    {
      icon: FileSearch,
      title: "Admin Review",
      description: "Our team reviews your images for quality and relevance",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      icon: FileCheck,
      title: "Document Compilation",
      description: "Images are compiled into a professional PDF document",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      icon: CheckCircle2,
      title: "Publication",
      description: "Your document is published to the knowledge base",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      icon: Bell,
      title: "Notification",
      description: "You'll receive a notification when it's live",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <SharedNavbar />

      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/50">
                <Upload className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-12 text-center">
            <h1 className="mb-3 text-4xl font-bold text-slate-900">
              Images Submitted Successfully!
            </h1>
            <p className="text-lg text-slate-600">
              We received{" "}
              <span className="font-semibold text-amber-600">
                {imageCount} image{imageCount !== 1 ? "s" : ""}
              </span>{" "}
              and they're now queued for admin review.
            </p>
          </div>

          {/* Processing Timeline */}
          <div className="mb-10 rounded-2xl border border-amber-200 bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                What Happens Next?
              </h2>
            </div>

            <div className="space-y-6">
              {timelineSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${step.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="mb-1 font-semibold text-slate-900">
                        {index + 1}. {step.title}
                      </h3>
                      <p className="text-sm text-slate-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    Estimated Processing Time
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Typically <strong>24-48 hours</strong>. We'll notify you as
                    soon as your document is published!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/browse">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-2 border-slate-300 text-base font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Browse Documents
              </Button>
            </Link>
            <Link href="/upload">
              <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl">
                <Upload className="mr-2 h-5 w-5" />
                Upload More Files
              </Button>
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Have questions about your submission?{" "}
              <Link
                href="/dashboard"
                className="font-medium text-blue-600 hover:underline"
              >
                Check your dashboard
              </Link>{" "}
              or contact support.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-slate-500">Loading...</div>
    </div>
  );
}

export default function ImagesSubmittedPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ImagesSubmittedContent />
    </Suspense>
  );
}
