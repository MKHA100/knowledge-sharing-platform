"use client";

import { useEffect, useState } from "react";
import {
  X,
  Heart,
  ThumbsDown,
  Share2,
  Download,
  Eye,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DocumentWithUploader } from "@/types";
import { LoginModal } from "@/components/login-modal";
import { useDocumentURLRouter } from "@/hooks/useDocumentURLRouter";

export function DocumentOverlay() {
  const {
    selectedDocument,
    setSelectedDocument,
    setShowThankYouPopup,
    isLoggedIn,
    setShowLoginModal,
  } = useApp();
  
  // URL router for shareable document links
  const { closeDocumentWithURL } = useDocumentURLRouter(
    setSelectedDocument,
    () => setSelectedDocument(null)
  );
  
  const [doc, setDoc] = useState<DocumentWithUploader | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fetch document from API
  useEffect(() => {
    if (!selectedDocument) {
      setDoc(null);
      setPdfUrl(null);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      try {
        const response = await api.documents.get(selectedDocument);
        if (response.success && response.data) {
          setDoc(response.data);
          setUpvotes(response.data.upvotes || 0);
          // Set PDF URL for preview
          if (response.data.file_path) {
            setPdfUrl(response.data.file_path);
          }
          // Track view
          await api.documents.view(selectedDocument);
          
          // Check if document is liked/upvoted
          try {
            const likedResponse = await fetch(`/api/documents/${selectedDocument}/upvote`);
            const likedData = await likedResponse.json();
            if (likedData.success) {
              setHasUpvoted(likedData.data.user_vote === "upvote");
              setHasDownvoted(likedData.data.user_vote === "downvote");
            }
          } catch (e) {
            console.error("Error checking liked status:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [selectedDocument]);

  // Disable body scroll when overlay is open
  useEffect(() => {
    if (selectedDocument) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedDocument]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDocument) return;
      if (e.key === "Escape") {
        closeDocumentWithURL();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDocument, closeDocumentWithURL]);

  const handleUpvote = async () => {
    if (!selectedDocument) return;
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const result = await api.documents.upvote(selectedDocument);
      if (result.success) {
        setUpvotes(result.data.upvotes);
        setHasUpvoted(result.data.user_vote === "upvote");
        setHasDownvoted(false);
        toast.success("Thanks for the feedback!");
      }
    } catch {
      toast.error("Failed to upvote");
    }
  };

  const handleDownvote = async () => {
    if (!selectedDocument) return;
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const result = await api.documents.downvote(selectedDocument);
      if (result.success) {
        setUpvotes(result.data.upvotes);
        setHasDownvoted(result.data.user_vote === "downvote");
        setHasUpvoted(false);
        toast("Feedback noted", { duration: 2000 });
      }
    } catch {
      toast.error("Failed to downvote");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/browse?doc=${selectedDocument}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand("copy");
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
      
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedDocument || !doc) return;

    // Require authentication for download
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setDownloading(true);
    try {
      console.log("[Overlay] Starting download for:", selectedDocument);
      const result = await api.documents.download(selectedDocument);
      console.log("[Overlay] Download API result:", result);
      
      if (result.success && result.data?.url) {
        console.log("[Overlay] Opening download URL:", result.data.url);
        
        // Open file in new tab only
        const newWindow = window.open(result.data.url, '_blank', 'noopener,noreferrer');
        
        // Show thank you popup after download regardless of popup blocker
        setShowThankYouPopup(true);
        
        if (!newWindow) {
          // Fallback: create a temporary link element for download
          const link = document.createElement('a');
          link.href = result.data.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("Download started!");
        } else {
          toast.success("Download started!");
        }
      } else {
        console.error("[Overlay] Download failed:", result.error);
        toast.error(result.error || "Failed to get download URL");
      }
    } catch (error) {
      console.error("[Overlay] Download error:", error);
      toast.error("Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  if (!selectedDocument) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dark Backdrop - Pexels style */}
      <div
        className="absolute inset-0 bg-black/90"
        onClick={closeDocumentWithURL}
      />

      {/* Close Button - Top left like Pexels */}
      <button
        onClick={closeDocumentWithURL}
        className="absolute mr-4 left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 text-white transition-colors hover:bg-slate-700"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Main Content - Scrollable */}
      <div className="relative z-10 flex w-full flex-col overflow-y-auto">
        {/* Top Header Bar - Fixed */}
        <div className="sticky top-0 z-20 bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
            {/* Uploader Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-slate-200">
                <AvatarImage
                  src={doc?.uploader_avatar || "/placeholder.svg"}
                  alt={doc?.uploader_name || "Anonymous"}
                />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {(doc?.uploader_name || "A").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-900">
                  {doc?.uploader_name || "Anonymous"}
                </p>
                
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Heart/Like */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleUpvote}
                className={cn(
                  "h-10 w-10 rounded-lg border-slate-300",
                  hasUpvoted
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Heart
                  className={cn("h-5 w-5", hasUpvoted && "fill-rose-500")}
                />
              </Button>

              {/* Share Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="h-10 w-10 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <Share2 className="h-5 w-5" />
              </Button>

              {/* Download Button - Teal like Pexels */}
              <Button
                onClick={(e) => handleDownload(e)}
                disabled={downloading || loading}
                type="button"
                className="h-10 gap-2 rounded-lg bg-teal-500 px-5 font-semibold text-white shadow-sm hover:bg-teal-600 transition-colors"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Free download</span>
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              </Button>
            </div>
          </div>
        </div>

        {/* Document Content Area */}
        <div className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl">
            {loading ? (
              <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white/50" />
              </div>
            ) : (
              <>
                {/* Document Title */}
                <h1 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
                  {doc?.title}
                </h1>

                {/* PDF Preview */}
                <div className="overflow-hidden rounded-xl bg-slate-800 shadow-2xl">
                  {pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      className="h-[70vh] w-full min-h-[500px]"
                      title={doc?.title || "Document Preview"}
                    />
                  ) : (
                    <div className="flex h-[70vh] min-h-[500px] flex-col items-center justify-center bg-slate-700">
                      <FileText className="mb-4 h-24 w-24 text-slate-500" />
                      <p className="text-lg text-slate-400">Document Preview</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Click &quot;Free download&quot; to get the full document
                      </p>
                    </div>
                  )}
                </div>

                {/* Document Stats */}
                <div className="mt-6 flex items-center justify-center gap-6 text-slate-400">
                  <span className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {(doc?.views || 0).toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    {(doc?.downloads || 0).toLocaleString()} downloads
                  </span>
                  <span className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    {upvotes.toLocaleString()} likes
                  </span>
                </div>

                {/* Additional Actions */}
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDownvote}
                    className={cn(
                      "gap-2 rounded-lg border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white",
                      hasDownvoted && "border-orange-500 text-orange-400",
                    )}
                  >
                    <ThumbsDown
                      className={cn(
                        "h-4 w-4",
                        hasDownvoted && "fill-orange-400",
                      )}
                    />
                    Report Issue
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="gap-2 rounded-lg border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal />
    </div>
  );
}
