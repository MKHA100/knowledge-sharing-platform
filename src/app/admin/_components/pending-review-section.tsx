"use client";

import { FileText, Check, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentWithUploader } from "@/types";
import { getSubjectDisplayName } from "@/lib/constants/subjects";

interface PendingReviewSectionProps {
  pending: DocumentWithUploader[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function PendingReviewSection({
  pending,
  onApprove,
  onReject,
}: PendingReviewSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pending Review
        </h1>
        <p className="text-slate-500">
          Documents that need your attention
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
          <Check className="mb-4 h-12 w-12 text-emerald-500" />
          <h2 className="mb-2 text-xl font-semibold text-slate-900">All caught up!</h2>
          <p className="text-slate-500">No documents pending review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-6 lg:flex-row">
                {/* Preview */}
                <div className="flex h-40 w-full shrink-0 items-center justify-center rounded-xl bg-slate-100 lg:w-48">
                  <FileText className="h-12 w-12 text-slate-300" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        by {item.uploader_name || "Anonymous"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="rounded-lg">
                          {(item.subject && getSubjectDisplayName(item.subject)) || item.subject || "Unknown"}
                        </Badge>
                        <Badge variant="secondary" className="rounded-lg capitalize">
                          {item.type || "Document"}
                        </Badge>
                        {item.medium && (
                          <Badge variant="secondary" className="rounded-lg capitalize">
                            {item.medium}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-lg",
                        "bg-amber-100 text-amber-700 hover:bg-amber-200",
                      )}
                    >
                      Pending Review
                    </Badge>
                  </div>

                  <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
                    <span>
                      Uploaded: {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.file_size && (
                      <span>
                        Size: {(item.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                      onClick={() => onApprove(item.id)}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 rounded-lg bg-white"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Category
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 rounded-lg bg-white text-rose-500 hover:text-rose-600"
                      onClick={() => onReject(item.id)}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
