"use client";

import React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  File,
  Layers,
  Upload,
  X,
  Check,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  PauseCircle,
} from "lucide-react";
import { SharedNavbar } from "@/components/shared-navbar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";
import { LoginModal } from "@/components/login-modal";
import { storeFilesForUpload } from "@/lib/utils/file-storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const documentTypes = [
  {
    id: "book",
    name: "Book",
    description: "Full textbooks or reference books",
    icon: BookOpen,
    color: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
  },
  {
    id: "notes",
    name: "Short Note",
    description: "Summary notes, handwritten or typed",
    icon: FileText,
    color: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  },
  {
    id: "papers",
    name: "Paper",
    description: "School paper, Past paper, Unit paper",
    icon: File,
    color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  },
  {
    id: "jumbled",
    name: "Jumbled",
    description: "Multiple mixed documents",
    icon: Layers,
    color: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  },
];

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefilledCategory = searchParams.get("category");

  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadState, setUploadState] = React.useState<
    "idle" | "uploading" | "success" | "images-submitted" | "paused"
  >("idle");
  
  // Upload status check
  const [uploadsEnabled, setUploadsEnabled] = React.useState<boolean | null>(null);
  const [uploadPauseReason, setUploadPauseReason] = React.useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = React.useState(true);

  // Check if uploads are enabled on mount
  React.useEffect(() => {
    const checkUploadStatus = async () => {
      try {
        const response = await fetch("/api/admin/settings/upload-status");
        const result = await response.json();
        
        if (result.success) {
          setUploadsEnabled(result.data.enabled);
          setUploadPauseReason(result.data.reason);
          if (!result.data.enabled) {
            setUploadState("paused");
          }
        }
      } catch (error) {
        console.error("Failed to check upload status:", error);
        // Default to enabled if check fails
        setUploadsEnabled(true);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUploadStatus();
  }, []);
  const [submittedImageCount, setSubmittedImageCount] = React.useState(0);
  const [showImageConfirmDialog, setShowImageConfirmDialog] = React.useState(false);

  // Helper to check if a file is an image
  const isImageFile = (file: File) => file.type.startsWith("image/");

  // Helper to check if file is Word document
  const isWordFile = (file: File) => 
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword";

  // Helper to check if file is PDF
  const isPdfFile = (file: File) => file.type === "application/pdf";

  // Check if all selected files are images
  const allFilesAreImages =
    files.length > 0 && files.every((file) => isImageFile(file));

  // Check files composition
  const imageFiles = files.filter(isImageFile);
  const wordFiles = files.filter(isWordFile);
  const pdfFiles = files.filter(isPdfFile);
  const otherFiles = files.filter(f => !isImageFile(f) && !isWordFile(f) && !isPdfFile(f));

  // New validation: allow images + Word/PDF, but not other combinations
  const hasInvalidMix = otherFiles.length > 0;

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenConverter = () => {
    window.open("https://www.ilovepdf.com/jpg_to_pdf", "_blank");
  };

  const processDocumentUpload = async () => {
    try {
      setUploadState("uploading");

      let documentFiles = [...pdfFiles];
      
      // Convert Word files to PDF
      if (wordFiles.length > 0) {
        toast.info(`Converting ${wordFiles.length} Word document(s) to PDF...`);
        
        for (const wordFile of wordFiles) {
          try {
            const formData = new FormData();
            formData.append("file", wordFile);

            const convertResponse = await fetch("/api/documents/convert-word", {
              method: "POST",
              body: formData,
            });

            if (convertResponse.ok) {
              const blob = await convertResponse.blob();
              const pdfName = wordFile.name.replace(/\.(docx?|DOCX?)$/, ".pdf");
              const pdfFile = new (File as any)([blob], pdfName, { type: "application/pdf" });
              documentFiles.push(pdfFile);
            } else {
              toast.error(`Failed to convert ${wordFile.name}`);
            }
          } catch (error) {
            console.error(`Error converting ${wordFile.name}:`, error);
            toast.error(`Failed to convert ${wordFile.name}`);
          }
        }
      }

      if (documentFiles.length === 0) {
        toast.error("No documents to upload after processing");
        setUploadState("idle");
        return;
      }

      // Convert to base64 for storage
      const fileDataPromises = documentFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );
        return { name: file.name, type: file.type, size: file.size, base64 };
      });

      const fileData = await Promise.all(fileDataPromises);
      await storeFilesForUpload(fileData);
      window.location.href = `/upload/details?type=${selectedType}&files=${documentFiles.length}`;
    } catch (error) {
      console.error("Error preparing files:", error);
      toast.error("Failed to prepare files. Please try again.");
      setUploadState("idle");
    }
  };

  const handleConfirmImageUpload = async () => {
    setShowImageConfirmDialog(false);
    setUploadState("uploading");

    try {
      // Submit images to admin
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append("files", file));

      const imageResponse = await fetch("/api/documents/submit-images", {
        method: "POST",
        body: formData,
      });

      const imageResult = await imageResponse.json();

      if (!imageResult.success) {
        const errorMessage = imageResult.error || "Failed to submit images";
        console.error("API Error:", errorMessage);
        toast.error(errorMessage, {
          description: "Please check the database setup or contact support.",
          duration: 8000,
        });
        setUploadState("idle");
        return;
      }

      toast.success(`${imageFiles.length} image(s) sent for admin review!`);

      // Check if there are other documents to process
      const hasOtherDocs = pdfFiles.length > 0 || wordFiles.length > 0;

      if (hasOtherDocs) {
        // Continue with document upload
        await processDocumentUpload();
      } else {
        // Images only - redirect to confirmation page
        router.push("/upload/images-submitted?count=" + imageFiles.length);
      }
    } catch (error) {
      console.error("Image submission error:", error);
      const message = error instanceof Error ? error.message : "Failed to submit images. Please try again.";
      toast.error(message, {
        description: "Check console for details or contact support.",
        duration: 8000,
      });
      setUploadState("idle");
    }
  };

  const handleContinue = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    // Check for invalid file types
    if (hasInvalidMix) {
      toast.error(
        "Please upload only PDFs, Word documents, and/or images. Other file types are not supported.",
      );
      return;
    }

    // If there are ANY images, show confirmation dialog first
    if (imageFiles.length > 0) {
      setShowImageConfirmDialog(true);
      return;
    }

    // No images - proceed with normal upload flow
    await processDocumentUpload();
  };

  const resetUpload = () => {
    setSelectedType(null);
    setFiles([]);
    setUploadState("idle");
  };

  const handleUpload = () => {
    // Placeholder for upload logic
    setUploadState("uploading");
    setTimeout(() => {
      setUploadState("success");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <SharedNavbar
        variant="back"
        backHref="/browse"
        backLabel="Back to Browse"
      />

      {/* Spacer for fixed navbar */}
      <div className="h-24" />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Upload Study Material
        </h1>
        <p className="mb-8 text-slate-500">
          Share your notes with thousands of O-Level students across Sri Lanka
        </p>

        {checkingStatus ? (
          /* Loading State - Checking upload status */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Loading...
            </h2>
            <p className="text-slate-500">
              Checking upload availability
            </p>
          </div>
        ) : uploadState === "paused" || !uploadsEnabled ? (
          /* Uploads Paused State */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <PauseCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              Uploads Temporarily Paused
            </h2>
            <p className="mb-4 max-w-md text-slate-600">
              Hey, we are really grateful for your support to help your fellow friends! 
              But please give us a brief moment while we quickly make some changes to our system 
              because we have experienced an overwhelming demand of uploads over the last few hours.
            </p>
            {uploadPauseReason && (
              <p className="mb-4 text-sm text-amber-700 bg-amber-100 px-4 py-2 rounded-lg">
                {uploadPauseReason}
              </p>
            )}
            <p className="mb-6 text-sm text-slate-500">
              Please check back in a little while. We appreciate your patience! 🙏
            </p>
            <div className="flex gap-3">
              <Link href="/browse">
                <Button variant="outline" className="rounded-xl bg-white">
                  Browse Documents
                </Button>
              </Link>
              <Button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              >
                Check Again
              </Button>
            </div>
          </div>
        ) : uploadState === "images-submitted" ? (
          /* Images Submitted to Admin State */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">
              Images Sent for Review!
            </h2>
            <p className="mb-2 text-slate-600">
              All {submittedImageCount} image(s) were sent to our admin team to
              compile and publish.
            </p>
            <p className="mb-6 text-sm text-slate-500">
              We&apos;ll convert them into a proper PDF document and publish it
              shortly. Thank you for contributing!
            </p>
            <div className="flex gap-3">
              <Link href="/browse">
                <Button variant="outline" className="rounded-xl bg-white">
                  View Documents
                </Button>
              </Link>
              <Button
                onClick={resetUpload}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              >
                Upload More
              </Button>
            </div>
          </div>
        ) : uploadState === "success" ? (
          /* Success State */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">Done!</h2>
            <p className="mb-6 text-slate-600">
              Your notes are now live. You just helped potentially 100+
              students!
            </p>
            <div className="flex gap-3">
              <Link href="/browse">
                <Button variant="outline" className="rounded-xl bg-white">
                  View Documents
                </Button>
              </Link>
              <Button
                onClick={resetUpload}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              >
                Upload More
              </Button>
            </div>
          </div>
        ) : uploadState === "uploading" ? (
          /* Uploading State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Uploading...
            </h2>
            <p className="text-slate-500">
              Our system is categorizing your notes
            </p>
          </div>
        ) : !selectedType ? (
          /* Document Type Selection */
          <div className="grid gap-4 sm:grid-cols-2">
            {documentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-8 text-center transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100"
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                      type.color,
                    )}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {type.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* File Upload Zone */
          <div className="space-y-6">
            {/* Selected Type Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {documentTypes.find((t) => t.id === selectedType)?.name}
                </span>
                {prefilledCategory && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {prefilledCategory}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                Change Type
              </Button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all",
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50",
              )}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                <Upload className="h-7 w-7 text-blue-600" />
              </div>
              <p className="mb-2 text-slate-700">
                Drag and drop files here, or{" "}
                <label className="cursor-pointer font-medium text-blue-600 hover:underline">
                  browse
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </p>
              <p className="text-sm text-slate-500">
                PDF, Images (JPG, PNG), Word documents
              </p>
              <p className="mt-2 text-sm font-medium text-blue-600">
                You can upload multiple files at once!
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900">
                  Selected Files ({files.length})
                </h3>

                {/* Image upload notice */}
                {imageFiles.length > 0 && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">
                        Images Detected ({imageFiles.length})
                      </p>
                      <p className="mt-1 text-amber-700">
                        You can either convert your images to PDF yourself using the button below, 
                        or send them to our admin team for review and compilation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mixed files warning */}
                {hasInvalidMix && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">
                        Invalid file types detected
                      </p>
                      <p className="mt-1 text-red-700">
                        Please upload only PDFs, Word documents, and/or images. Other file types are not supported.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {isImageFile(file) ? (
                          <ImageIcon className="h-5 w-5 shrink-0 text-amber-500" />
                        ) : (
                          <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                        )}
                        <span className="truncate text-sm text-slate-700">
                          {file.name}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {imageFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Convert Yourself Button */}
                <Button
                  onClick={handleOpenConverter}
                  className="h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
                  disabled={(uploadState as string) === "uploading"}
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Convert Yourself
                </Button>
                
                {/* Send to Admin Button */}
                <Button
                  onClick={handleContinue}
                  disabled={files.length === 0 || hasInvalidMix}
                  className="h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  Send to Admin
                </Button>
              </div>
            ) : (
              /* Continue Button for documents only */
              <Button
                onClick={handleContinue}
                disabled={files.length === 0 || hasInvalidMix}
                className="h-12 w-full rounded-xl text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/25"
              >
                Continue to Details
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Image Confirmation Dialog */}
      <AlertDialog open={showImageConfirmDialog} onOpenChange={setShowImageConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Image Upload Confirmation</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You have selected <strong>{imageFiles.length} image file(s)</strong>
                  {pdfFiles.length + wordFiles.length > 0 && (
                    <> and <strong>{pdfFiles.length + wordFiles.length} document file(s)</strong></>
                  )}.
                </p>
                <p>
                  Images will be sent to our admin team for review and compilation into a 
                  professional document. This process typically takes 24-48 hours.
                </p>
                <p className="text-sm font-medium">
                  Would you like to proceed with sending these images to the admin team?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmImageUpload}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              Yes, Send for Admin Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoginModal />
    </div>
  );
}

function Loading() {
  return null;
}

export default function UploadPage() {
  return (
    <AppProvider>
      <ToastProvider />
      <Suspense fallback={<Loading />}>
        <UploadContent />
      </Suspense>
    </AppProvider>
  );
}
