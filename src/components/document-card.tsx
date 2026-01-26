"use client";

import React, { memo } from "react";
import { useState } from "react";
import Image from "next/image";
import {
  Heart,
  Download,
  FileText,
  ThumbsDown,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { getSubjectDisplayName } from "@/lib/constants/subjects";
import type { DocumentWithUploader } from "@/types";

interface DocumentCardProps {
  document: DocumentWithUploader;
}

// Memoize component to prevent unnecessary re-renders
export const DocumentCard = memo(function DocumentCard({ document }: DocumentCardProps) {
  const { setSelectedDocument, isLoggedIn, setShowLoginModal } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(document.upvotes);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const result = await api.documents.upvote(document.id);
      if (result.success) {
        setUpvoteCount(result.data.upvotes);
        setHasLiked(result.data.user_vote === "upvote");
        setHasDownvoted(false); // Clear downvote when liking
        toast.success(
          hasLiked ? "Like removed" : "Thanks for your feedback!",
        );
      }
    } catch {
      toast.error("Failed to like");
    }
  };

  const handleDownvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const result = await api.documents.downvote(document.id);
      if (result.success) {
        setHasDownvoted(result.data.user_vote === "downvote");
        setHasLiked(false); // Clear like when downvoting
        toast("Feedback noted", { duration: 2000 });
      }
    } catch {
      toast.error("Failed to downvote");
    }
  };

  const handleClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setSelectedDocument(document.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setSelectedDocument(document.id);
  };

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-100 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Document Preview Area */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Background with optimized thumbnail or fallback gradient */}
        {document.thumbnail_url ? (
          <div className="absolute inset-0 bg-slate-100">
            {/* Optimized thumbnail with Next.js Image */}
            <Image
              src={document.thumbnail_url}
              alt={document.title}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-20 w-20 text-slate-300" />
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Top Right - Like & Downvote buttons (slide in from right) */}
        <div
          className={cn(
            "absolute right-3 top-3 flex items-center gap-2 transition-all duration-300",
            isHovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
          )}
        >
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur-md transition-all",
              hasLiked
                ? "bg-white text-rose-500"
                : "bg-black/40 text-white hover:bg-black/60",
            )}
            aria-label={hasLiked ? "Unlike" : "Like"}
          >
            <Heart className={cn("h-5 w-5", hasLiked && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={handleDownvote}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur-md transition-all",
              hasDownvoted
                ? "bg-white text-slate-700"
                : "bg-black/40 text-white hover:bg-black/60",
            )}
            aria-label={hasDownvoted ? "Remove downvote" : "Downvote"}
          >
            <ThumbsDown className={cn("h-5 w-5", hasDownvoted && "fill-current")} />
          </button>
        </div>

        {/* Bottom - Author & Download (slide in from bottom) */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-between p-4 transition-all duration-300",
            isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-white/30">
              {document.uploader_avatar && (
                <AvatarImage
                  src={document.uploader_avatar}
                  alt={document.uploader_name || "Anonymous"}
                />
              )}
              <AvatarFallback className="bg-white/20 text-xs text-white">
                {(document.uploader_name || "A").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-white drop-shadow-md">
              {document.uploader_name || "Anonymous"}
            </span>
          </div>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-lg transition-all hover:bg-slate-100"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        {/* Type Badge - Always visible */}
        <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm shadow-sm">
          {document.type === "short_note"
            ? "Notes"
            : document.type === "paper"
              ? "Paper"
              : "Book"}
        </span>
      </div>

      {/* Content - Title only */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
          {document.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {document.downloads.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {upvoteCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {document.views.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});
