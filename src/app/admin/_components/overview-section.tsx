"use client";

import {
  FileText,
  Users,
  Download,
  Clock,
  Check,
  ThumbsUp,
  ThumbsDown,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { DocumentWithUploader } from "@/types";
import type { AdminStats, DownvotedDocument, StatCard } from "./types";

interface OverviewSectionProps {
  stats: AdminStats | null;
  pending: DocumentWithUploader[];
  downvoted: DownvotedDocument[];
  onNavigate: (section: string) => void;
}

export function OverviewSection({
  stats,
  pending,
  downvoted,
  onNavigate,
}: OverviewSectionProps) {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{
    processed: number;
    failed: number;
    total: number;
  } | null>(null);

  const handleBackfillThumbnails = async () => {
    setIsBackfilling(true);
    setBackfillResult(null);

    try {
      const response = await fetch("/api/admin/backfill-thumbnails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchSize: 10,
          limit: 100,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBackfillResult(data.data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Backfill error:", error);
      alert("Failed to backfill thumbnails. Please try again.");
    } finally {
      setIsBackfilling(false);
    }
  };

  const statCards: StatCard[] = [
    {
      label: "Total Documents",
      value: stats?.totalDocuments?.toLocaleString() || "0",
      change: "+12%",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers?.toLocaleString() || "0",
      change: "+8%",
      icon: Users,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Downloads Today",
      value: stats?.downloadsToday?.toLocaleString() || "0",
      change: "+24%",
      icon: Download,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pending Review",
      value: stats?.pendingReview?.toLocaleString() || "0",
      change: "",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard Overview
        </h1>
        <p className="text-slate-500">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    stat.color,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                {stat.change && (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Review Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">
            Pending Review
          </h2>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-8">
                <Check className="mb-2 h-8 w-8 text-emerald-500" />
                <p className="text-sm text-slate-500">All caught up! No pending reviews.</p>
              </div>
            ) : (
              pending.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-sm text-slate-500">
                        by {item.uploader_name || "Anonymous"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate("pending")}
                    className="rounded-lg bg-white"
                  >
                    Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Downvoted Documents Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">
            Downvoted Documents
          </h2>
          <div className="space-y-3">
            {downvoted.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-8">
                <ThumbsUp className="mb-2 h-8 w-8 text-emerald-500" />
                <p className="text-sm text-slate-500">No downvoted documents!</p>
              </div>
            ) : (
              downvoted.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
                      <ThumbsDown className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-sm text-rose-500">
                        {item.downvotes} downvotes
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate("downvoted")}
                    className="rounded-lg bg-white"
                  >
                    Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Backfill Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="mb-2 font-semibold text-slate-900">
              Generate Thumbnails
            </h2>
            <p className="text-sm text-slate-500">
              Generate thumbnail images for documents that don&apos;t have them yet
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ImagePlus className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6">
          {backfillResult ? (
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="mb-2 font-medium text-emerald-900">
                Backfill Complete!
              </p>
              <div className="space-y-1 text-sm text-emerald-700">
                <p>✓ Processed: {backfillResult.processed} documents</p>
                {backfillResult.failed > 0 && (
                  <p>✗ Failed: {backfillResult.failed} documents</p>
                )}
                <p>Total: {backfillResult.total} documents</p>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleBackfillThumbnails}
              disabled={isBackfilling}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              {isBackfilling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Thumbnails...
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Backfill Thumbnails
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
