"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  User,
  Upload,
  Menu,
  X,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

interface SharedNavbarProps {
  variant?: "default" | "back" | "browse";
  backHref?: string;
  backLabel?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function SharedNavbar({
  variant = "default",
  backHref = "/",
  backLabel = "Back",
  searchQuery = "",
  onSearchChange,
}: SharedNavbarProps) {
  const { isLoggedIn, setShowLoginModal } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        isScrolled ? "py-3" : "py-4",
      )}
    >
      <div
        className={cn(
          "mx-auto px-4",
          variant === "browse" ? "max-w-7xl" : "max-w-6xl",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-4 rounded-2xl px-6 py-3 transition-all duration-300",
            "bg-gradient-to-r from-blue-50/90 to-cyan-50/90 backdrop-blur-md border border-blue-200/30 shadow-lg",
            variant === "browse" ? "justify-between" : "justify-between",
          )}
        >
          {/* Left - Logo or Back */}
          <div className="flex items-center gap-3">
            {variant === "back" && (
              <Link
                href={backHref}
                className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
              ></Link>
            )}
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:block">
                study<span className="text-blue-600">share</span>
              </span>
            </Link>
          </div>

          {/* Center - Search Bar (Browse variant) or Nav Links */}
          {variant === "browse" ? (
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50 pl-11 text-sm placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          ) : (
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
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100/70 text-blue-700 transition-all hover:bg-blue-200/70 hover:scale-105"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl bg-white/95 backdrop-blur-sm border-blue-200/30 shadow-xl"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium px-3 py-2 rounded-md"
                    >
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard?tab=account"
                      className="text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium px-3 py-2 rounded-md"
                    >
                      Settings
                    </Link>
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
          <div className="bg-gradient-to-r from-blue-50/95 to-cyan-50/95 backdrop-blur-md border border-blue-200/30 shadow-xl mt-2 rounded-2xl p-4 md:hidden">
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
  );
}
