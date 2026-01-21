"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Upload, Bell, Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/app-context";

export function Navigation() {
  const { user, isLoggedIn, setShowLoginModal, hasNewNotification } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-200/20 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-md supports-[backdrop-filter]:bg-blue-50/60">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-semibold text-foreground sm:block">
              StudyShare
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-xl md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for notes, papers, books..."
                className="w-full pl-10 bg-secondary border-0 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Upload Button */}
            <Link href="/upload">
              <Button className="hidden sm:flex gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                size="icon"
                className="sm:hidden bg-primary hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </Link>

            {isLoggedIn ? (
              <>
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user?.avatar || "/placeholder.svg"}
                          alt={user?.name}
                        />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {hasNewNotification && (
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary animate-pulse" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white/95 backdrop-blur-sm border-blue-200/30 shadow-xl"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center px-3 py-2 rounded-md font-medium"
                      >
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard?tab=notifications"
                        className="cursor-pointer flex items-center gap-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all px-3 py-2 rounded-md font-medium"
                      >
                        <Bell className="h-4 w-4" />
                        Notifications
                        {hasNewNotification && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard?tab=account"
                        className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center px-3 py-2 rounded-md font-medium"
                      >
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowLoginModal(true)}
                className="hidden sm:flex"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {mobileMenuOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for notes, papers, books..."
                className="w-full pl-10 bg-secondary border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {!isLoggedIn && (
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
              >
                Sign In
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
