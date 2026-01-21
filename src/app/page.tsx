"use client";

import React from "react";
import { Suspense } from "react";
import { useState, useEffect } from "react";
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
  User,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppProvider, useApp } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";
import { LoginModal } from "@/components/login-modal";
import { WelcomeToast } from "@/components/welcome-toast";
import { SUBJECTS, getSubjectDisplayName } from "@/lib/constants/subjects";
import { api } from "@/lib/api/client";
import type { DocumentWithUploader } from "@/types";

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
  const { isLoggedIn, setShowLoginModal } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/browse");
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/browse?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Navigation */}
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled ? "py-3" : "py-4"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div
            className={`flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-300 ${
              isScrolled ? "glass shadow-lg" : "bg-transparent"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                study<span className="text-blue-600">share</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-1 md:flex">
              <Link
                href="/browse"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Browse
              </Link>
              <Link
                href="/browse?type=paper"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Past Papers
              </Link>
              <Link
                href="/browse?type=note"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Notes
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      <User className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">My Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard?tab=account">Settings</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:block"
                >
                  Sign in
                </button>
              )}

              <Link href="/upload" className="hidden sm:block">
                <Button className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 md:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="glass mt-2 rounded-2xl p-4 md:hidden">
              <div className="flex flex-col gap-1">
                <Link
                  href="/browse"
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse All
                </Link>
                <Link
                  href="/browse?type=paper"
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Past Papers
                </Link>
                <Link
                  href="/browse?type=note"
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notes
                </Link>
                <div className="my-2 border-t border-slate-200" />
                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Sign in
                  </button>
                )}
                <Link
                  href="/upload"
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-center text-sm font-medium text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Upload Document
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">
                study<span className="text-blue-600">share</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <Link
                href="/browse"
                className="transition-colors hover:text-slate-900"
              >
                Browse
              </Link>
              <Link
                href="/upload"
                className="transition-colors hover:text-slate-900"
              >
                Upload
              </Link>
              <Link href="#" className="transition-colors hover:text-slate-900">
                About
              </Link>
              <Link href="#" className="transition-colors hover:text-slate-900">
                Contact
              </Link>
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
    <AppProvider>
      <ToastProvider />
      <Suspense fallback={<Loading />}>
        <WelcomeToast />
        <LandingPage />
      </Suspense>
    </AppProvider>
  );
}
