"use client";

import { useState } from "react";
import { ThumbsDown, Eye, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { DownvotedDocument } from "./types";

interface DownvotedSectionProps {
  documents: DownvotedDocument[];
  onResetVotes?: (documentId: string) => void;
  onRemove?: (documentId: string) => void;
  onView?: (documentId: string) => void;
}

export function DownvotedSection({
  documents,
  onResetVotes,
  onRemove,
  onView,
}: DownvotedSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResetVotes = async (documentId: string) => {
    setProcessingId(documentId);
    try {
      if (onResetVotes) {
        await onResetVotes(documentId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (documentId: string) => {
    setProcessingId(documentId);
    try {
      if (onRemove) {
        await onRemove(documentId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Downvoted Documents</h1>
        <p className="text-slate-500">
          Review documents with significant downvotes ({documents.length} documents)
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <ThumbsDown className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Downvoted Documents</h3>
          <p className="mt-1 text-slate-500">All documents are in good standing!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Document Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{doc.title}</h3>
                      <p className="text-sm text-slate-500">{doc.subject}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-rose-200 bg-rose-50 text-rose-700"
                    >
                      <ThumbsDown className="mr-1 h-3 w-3" />
                      {doc.downvote_count || doc.downvotes || 0} downvotes
                    </Badge>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={doc.author?.avatar_url || undefined} />
                      <AvatarFallback className="bg-slate-100 text-xs text-slate-600">
                        {doc.author?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-600">
                      Uploaded by {doc.author?.name || "Unknown"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString()
                        : "Unknown date"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{doc.view_count || 0} views</span>
                    <span>{doc.download_count || 0} downloads</span>
                    <span>
                      Ratio:{" "}
                      {doc.upvote_count && doc.downvote_count
                        ? `${doc.upvote_count}↑ / ${doc.downvote_count}↓`
                        : `${doc.upvotes || 0}↑ / ${doc.downvotes || 0}↓`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(doc.id)}
                    className="gap-2 rounded-lg"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetVotes(doc.id)}
                    disabled={processingId === doc.id}
                    className="gap-2 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Votes
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processingId === doc.id}
                        className="gap-2 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove "{doc.title}"? This action cannot be
                          undone and the document will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(doc.id)}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700"
                        >
                          Remove Document
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
