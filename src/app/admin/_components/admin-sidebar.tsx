"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  ThumbsDown,
  MessageSquare,
  BookOpen,
  Menu,
  Image,
  Lightbulb,
  Settings,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem } from "./types";

// Icon mapping for string-based icon names
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  ThumbsDown,
  MessageSquare,
  Image,
  Lightbulb,
  Settings,
  Heart,
};

interface AdminSidebarProps {
  navItems: NavItem[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  badgeCounts: {
    pending: number;
    pendingImages: number;
    downvoted: number;
    thankYou: number;
    recommendations: number;
  };
}

export function AdminSidebar({
  navItems,
  activeSection,
  onSectionChange,
  isOpen,
  onToggle,
  badgeCounts,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={onToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300",
          isOpen ? "w-64" : "w-16",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          {isOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-bold text-slate-900">StudyShare</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Admin
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || FileText;
            const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                  activeSection === item.id
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  !isOpen && "justify-center",
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgeCount > 0 && (
                      <Badge
                        className={cn(
                          "ml-auto",
                          activeSection === item.id
                            ? "bg-white/20 text-white hover:bg-white/30"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200",
                        )}
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </>
                )}
                {!isOpen && badgeCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <div className="border-t border-slate-200 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full justify-center rounded-lg text-slate-500 hover:text-slate-900",
              isOpen && "justify-start gap-3 px-3",
            )}
          >
            <Menu className="h-4 w-4" />
            {isOpen && <span>Collapse</span>}
          </Button>
        </div>

        {/* Back to App Link */}
        <div className="border-t border-slate-200 p-3">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900",
              !isOpen && "justify-center",
            )}
          >
            <svg
              className="h-5 w-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {isOpen && <span>Back to App</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
