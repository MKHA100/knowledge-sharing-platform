"use client";

import React from "react";
import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Upload,
  BookOpen,
  FileText,
  Calculator,
  FlaskConical,
  Clock,
  Heart,
  Briefcase,
  Palette,
  Music,
  ArrowRight,
  Sparkles,
  Send,
  MessageSquare,
  Instagram,
  Linkedin,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoginModal } from "@/components/login-modal";
import { WelcomeToast } from "@/components/welcome-toast";
import { LandingNavbar } from "@/components/landing-navbar";
import { SUBJECTS } from "@/lib/constants/subjects";

const categoryIcons: Record<string, React.ReactNode> = {
  sinhala: <BookOpen className="h-5 w-5" />,
  english: <FileText className="h-5 w-5" />,
  mathematics: <Calculator className="h-5 w-5" />,
  science: <FlaskConical className="h-5 w-5" />,
  history: <Clock className="h-5 w-5" />,
  religion: <Heart className="h-5 w-5" />,
  basket1: <Briefcase className="h-5 w-5" />,
  basket2: <Palette className="h-5 w-5" />,
  basket3: <Music className="h-5 w-5" />,
};

// Take first 9 subjects for landing page
const landingCategories = SUBJECTS.slice(0, 9).map((subject) => ({
  id: subject.id,
  name: subject.displayName,
}));

function Loading() {
  return null;
}

function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackName || !feedbackEmail || !feedbackMessage) {
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackName,
          email: feedbackEmail,
          message: feedbackMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFeedbackName("");
        setFeedbackEmail("");
        setFeedbackMessage("");
        toast.success("Thank you! Your feedback helps us improve StudyShare.");
      } else {
        toast.error(result.error || "Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/browse");
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/browse/${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pb-16 pt-32">
        {/* Decorative Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Free study materials for O-Level students
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Find study materials
            <br />
            <span className="gradient-text">shared by students</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 sm:text-xl">
            Past papers, short notes, and resources for O-Level students in Sri
            Lanka. Everything you need to succeed, all in one place.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 glow-blue">
              <div className="flex items-center gap-2">
                <Search className="ml-4 h-5 w-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search for past papers, notes, subjects..."
                  className="h-12 flex-1 border-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 sm:text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                >
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-slate-500">Popular:</span>
            {["Mathematics", "Science", "English", "Past Papers"].map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => router.push(`/browse?q=${item.toLowerCase()}`)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              Browse by Subject
            </h2>
            <p className="text-slate-600">
              Find exactly what you need for your studies
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landingCategories.map((category, index) => {
              const colors = [
                "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
                "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
                "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
                "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
                "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
                "bg-pink-50 text-pink-600 group-hover:bg-pink-100",
                "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100",
                "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
                "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
              ];
              const icons = [
                <BookOpen key="book" className="h-5 w-5" />,
                <FileText key="file" className="h-5 w-5" />,
                <Calculator key="calc" className="h-5 w-5" />,
                <FlaskConical key="flask" className="h-5 w-5" />,
                <Clock key="clock" className="h-5 w-5" />,
                <Heart key="heart" className="h-5 w-5" />,
                <Briefcase key="brief" className="h-5 w-5" />,
                <Palette key="palette" className="h-5 w-5" />,
                <Music key="music" className="h-5 w-5" />,
              ];
              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${colors[index % colors.length]}`}
                  >
                    {icons[index % icons.length]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {category.name}
                    </p>
                    <p className="text-sm text-slate-500">Browse subject</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-center text-white shadow-2xl shadow-blue-500/25 sm:p-12">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
                Help other students succeed
              </h2>
              <p className="mb-8 text-blue-100">
                Share your notes, past papers, and study materials. Together, we
                can make O-Level prep easier for everyone.
              </p>
              <Link href="/upload">
                <Button
                  size="lg"
                  className="rounded-full bg-white px-8 font-medium text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Share Your Materials
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="border-t border-slate-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-slate-900">Help Us Improve</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Your ideas shape the future of StudyShare. Tell us what features you need or how we can better serve you.
            </p>
          </div>

          <div className="mx-auto max-w-2xl rounded-3xl border border-white/50 bg-white/70 p-8 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="feedback-name" className="mb-2 block text-sm font-medium text-slate-700">
                    Your Name
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    placeholder="Enter your name"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label htmlFor="feedback-email" className="mb-2 block text-sm font-medium text-slate-700">
                    Your Email
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    placeholder="your@email.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="feedback-message" className="mb-2 block text-sm font-medium text-slate-700">
                  Your Ideas & Suggestions
                </label>
                <textarea
                  id="feedback-message"
                  placeholder="Tell us what features you'd like to see, improvements you recommend, or how we can make StudyShare more suitable for your needs..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingFeedback}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl disabled:opacity-50"
              >
                {isSubmittingFeedback ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Send Your Ideas
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-slate-900">
                  study<span className="text-blue-600">share</span>
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                A community-driven platform for Sri Lankan O-Level students to share and access quality study materials.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Quick Links</h3>
              <div className="flex flex-col gap-3 text-sm text-slate-500">
                <Link href="/browse" className="transition-colors hover:text-slate-900">
                  Browse Documents
                </Link>
                <Link href="/upload" className="transition-colors hover:text-slate-900">
                  Upload Materials
                </Link>
                <Link href="/dashboard" className="transition-colors hover:text-slate-900">
                  My Dashboard
                </Link>
                <Link href="/faq" className="transition-colors hover:text-slate-900">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Connect */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Connect With Us</h3>
              <p className="mb-4 text-sm text-slate-500">
                Have questions or want to get in touch? Reach out through any of these platforms.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/YOUR_PHONE_NUMBER"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white hover:shadow-lg"
                  aria-label="WhatsApp"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
                <a
                  href="https://instagram.com/YOUR_HANDLE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600 transition-all hover:bg-pink-600 hover:text-white hover:shadow-lg"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://linkedin.com/in/YOUR_PROFILE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-lg"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="mailto:your.email@example.com"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-slate-600 hover:text-white hover:shadow-lg"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-400">
            Made with care for Sri Lankan students
          </div>
        </div>
      </footer>

      <LoginModal />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <WelcomeToast />
      <LandingPage />
    </Suspense>
  );
}
