"use client";

import { useState, useEffect } from "react";
import { Upload, Heart, X, Coffee } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/app-context";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import type { DocumentWithUploader } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const feedbackOptions = [
  { emoji: "helpful", label: "Helpful", icon: "👍" },
  { emoji: "veryhelpful", label: "Very Helpful", icon: "😃" },
  { emoji: "lifesaver", label: "Life Saver!", icon: "❤️" },
];

export function ThankYouPopup() {
  const {
    showThankYouPopup,
    setShowThankYouPopup,
    selectedDocument,
    setSelectedDocument,
  } = useApp();
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [doc, setDoc] = useState<DocumentWithUploader | null>(null);
  const [sent, setSent] = useState(false);

  // Fetch document when popup opens
  useEffect(() => {
    if (showThankYouPopup && selectedDocument) {
      api.documents.get(selectedDocument).then((res) => {
        if (res.success) setDoc(res.data);
      });
    }
  }, [showThankYouPopup, selectedDocument]);

  // Reset state when popup opens
  useEffect(() => {
    if (showThankYouPopup) {
      setSent(false);
      setSelectedFeedback(null);
      setMessage("");
    }
  }, [showThankYouPopup]);

  const handleSendFeedback = async () => {
    if (selectedDocument && selectedFeedback) {
      try {
        const happinessMap: Record<string, string> = {
          helpful: "helpful",
          veryhelpful: "very_helpful",
          lifesaver: "life_saver",
        };
        await api.comments.create({
          document_id: selectedDocument,
          happiness: happinessMap[selectedFeedback] || "helpful",
          content: message || null,
        });
        setSent(true);
        toast.success("Message sent! You made someone's day! 🎉");
      } catch {
        toast.error("Failed to send feedback");
      }
    }
  };

  const handleClose = () => {
    setShowThankYouPopup(false);
    setSelectedDocument(null);
    setSelectedFeedback(null);
    setMessage("");
    setSent(false);
  };

  if (!showThankYouPopup) return null;

  // Show loading state while fetching document
  if (!doc) {
    return (
      <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 py-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="animate-pulse">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-200" />
            <div className="mt-4 h-6 w-32 mx-auto rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 py-8"
      onClick={handleClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with uploader info - Pexels style */}
        <div className="px-6 pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage
                src={doc.uploader_avatar || "/placeholder.svg"}
                alt={doc.uploader_name || "Uploader"}
              />
              <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-bold">
                {(doc.uploader_name || "A").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Say Thanks to {doc.uploader_name || "Anonymous"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Credit isn&apos;t required, but a kind message means a lot!
            </p>
          </div>
        </div>

        {sent ? (
          /* Thank You Sent State */
          <div className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Heart className="h-8 w-8 text-green-600 fill-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Thanks sent! 🎉
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Your appreciation means the world to contributors.
            </p>

            {/* Upload CTA */}
            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <Coffee className="mx-auto h-8 w-8 text-teal-600 mb-3" />
              <p className="mb-4 text-sm text-slate-600">
                Have materials to share?{" "}
                <span className="font-medium text-teal-600">
                  Pay it forward!
                </span>
              </p>
              <Link href={`/upload?subject=${doc.subject || ""}`}>
                <Button className="w-full gap-2 rounded-lg bg-teal-500 font-semibold text-white hover:bg-teal-600">
                  <Upload className="h-4 w-4" />
                  Upload & Help Others
                </Button>
              </Link>
            </div>

            <button
              onClick={handleClose}
              className="mt-4 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        ) : (
          /* Main Content */
          <div className="p-6">
            {/* Feedback Emoji Options */}
            <div className="mb-5">
              <p className="mb-3 text-sm font-medium text-slate-700 text-center">
                How helpful was this document?
              </p>
              <div className="flex justify-center gap-3">
                {feedbackOptions.map((option) => (
                  <button
                    key={option.emoji}
                    type="button"
                    onClick={() => setSelectedFeedback(option.emoji)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-3 transition-all hover:border-teal-400 hover:bg-teal-50",
                      selectedFeedback === option.emoji
                        ? "border-teal-500 bg-teal-50 shadow-sm"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-xs font-medium text-slate-600">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Write a message{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <Textarea
                placeholder="Thanks for sharing this! It really helped me prepare for my exams..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[90px] resize-none rounded-lg border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:ring-teal-400"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendFeedback}
              disabled={!selectedFeedback}
              className={cn(
                "h-11 w-full rounded-lg font-semibold transition-all",
                selectedFeedback
                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
              )}
            >
              Send Thanks
            </Button>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full py-2 text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
