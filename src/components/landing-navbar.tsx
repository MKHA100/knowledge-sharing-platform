"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Upload, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/app-context";

export function LandingNavbar() {
  const { isLoggedIn, setShowLoginModal, user } = useApp();
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
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 focus:outline-none"
                  >
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                      <AvatarImage 
                        src={user?.avatar || undefined} 
                        alt={user?.name || 'User'} 
                      />
                      <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || 
                         user?.email?.charAt(0)?.toUpperCase() || 
                         'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl bg-white border-slate-200 shadow-lg p-2"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium px-3 py-2.5 rounded-lg"
                    >
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard?tab=account"
                      className="cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium px-3 py-2.5 rounded-lg"
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
          <div className="g-gradient-to-r from-blue-50/95 to-cyan-50/95 backdrop-blur-md border border-blue-200/30 shadow-xl mt-2 rounded-2xl p-4 md:hidden">
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
