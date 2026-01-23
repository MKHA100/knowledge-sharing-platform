"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Upload,
  Search,
  Loader2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { SharedNavbar } from "@/components/shared-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SUBJECTS, getSubjectDisplayName } from "@/lib/constants/subjects";
import {
  getStoredFilesForUpload,
  clearStoredFiles,
} from "@/lib/utils/file-storage";

interface StoredFile {
  name: string;
  type: string;
  size: number;
  base64: string;
}

interface FileData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBase64: string;
  documentName: string;
  medium: string;
  subject: string;
  documentType: string;
  aiCategorized?: boolean;
  aiConfidence?: number;
  isProcessing: boolean;
}

const MEDIUMS = ["Sinhala", "English", "Tamil"];
const DOCUMENT_TYPE_OPTIONS = [
  { value: "book", label: "Book" },
  { value: "notes", label: "Short Note" },
  { value: "paper", label: "Past Paper" },
];

const DOCUMENT_TYPES: Record<string, string> = {
  book: "Book",
  notes: "Short Note",
  paper: "Past Paper",
  jumbled: "Jumbled Collection",
};

// Helper to map AI language response to our medium values
function mapLanguageToMedium(language: string): string {
  const lang = language?.toLowerCase() || "";
  if (lang.includes("sinhala")) return "Sinhala";
  if (lang.includes("tamil")) return "Tamil";
  if (lang.includes("english")) return "English";
  return "";
}

// Helper to map AI document type response to our document type values
function mapAIDocumentType(aiDocType: string): string {
  if (!aiDocType) return "";
  const normalized = aiDocType.toLowerCase().trim();
  if (normalized.includes("book")) return "book";
  if (normalized.includes("note") || normalized.includes("short")) return "notes";
  if (normalized.includes("paper") || normalized.includes("past") || normalized.includes("exam")) return "paper";
  return "";
}

// Helper to find the closest matching subject ID from AI response
function mapAISubjectToId(aiSubject: string): string {
  if (!aiSubject) return "";

  const normalizedAI = aiSubject.toLowerCase().trim();

  // First try exact match on display name
  const exactMatch = SUBJECTS.find(
    (s) => s.displayName.toLowerCase() === normalizedAI,
  );
  if (exactMatch) return exactMatch.id;

  // Try matching on ID
  const idMatch = SUBJECTS.find(
    (s) => s.id === normalizedAI.replace(/[\s&]/g, "_"),
  );
  if (idMatch) return idMatch.id;

  // Try partial match on display name
  const partialMatch = SUBJECTS.find(
    (s) =>
      s.displayName.toLowerCase().includes(normalizedAI) ||
      normalizedAI.includes(s.displayName.toLowerCase()),
  );
  if (partialMatch) return partialMatch.id;

  // Try matching on search terms
  const searchMatch = SUBJECTS.find((s) =>
    s.searchTerms.some(
      (term) =>
        normalizedAI.includes(term.toLowerCase()) ||
        term.toLowerCase().includes(normalizedAI),
    ),
  );
  if (searchMatch) return searchMatch.id;

  // Return empty if no match found
  return "";
}

export function UploadDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const uploadType = searchParams.get("type") || "book";
  const fileCount = parseInt(searchParams.get("files") || "1");

  const [files, setFiles] = useState<FileData[]>([]);
  const [subjectSearch, setSubjectSearch] = useState<Record<string, string>>(
    {},
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Load files from IndexedDB and start progressive AI categorization
  useEffect(() => {
    const loadAndCategorize = async () => {
      setLoadingFiles(true);

      // Get files from IndexedDB
      const storedFiles = await getStoredFilesForUpload();
      if (!storedFiles || storedFiles.length === 0) {
        toast.error("No files found. Please upload files again.");
        router.push("/upload");
        return;
      }

      try {
        // Initialize files with loading state
        const initialFiles: FileData[] = storedFiles.map((file, index) => ({
          id: `file-${index}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileBase64: file.base64,
          documentName: "",
          medium: "",
          subject: "",
          documentType: uploadType === "jumbled" ? "" : uploadType,
          aiCategorized: false,
          isProcessing: true,
        }));

        setFiles(initialFiles);
        setLoadingFiles(false);

        // Process files progressively - one at a time
        for (let i = 0; i < initialFiles.length; i++) {
          const file = initialFiles[i];
          
          // Skip AI categorization for image files - they go to admin review
          const isImage = file.fileType.startsWith("image/");
          if (isImage) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === file.id
                  ? {
                      ...f,
                      documentName: file.fileName.replace(/\.[^/.]+$/, ""),
                      isProcessing: false,
                      aiCategorized: false,
                    }
                  : f,
              ),
            );
            continue; // Skip to next file
          }
          
          try {
            // For large files, we'll let the server handle sampling
            // But limit what we send to avoid body size issues
            // If file is over 8MB base64, truncate (server will still try to process)
            const MAX_BASE64_SIZE = 8 * 1024 * 1024; // 8MB
            let contentToSend = file.fileBase64;

            if (file.fileBase64.length > MAX_BASE64_SIZE) {
              console.log(
                `File ${file.fileName} is large (${Math.round(file.fileBase64.length / 1024 / 1024)}MB), sending truncated for analysis`,
              );
              // For very large files, just send the filename for basic categorization
              // The server will use filename-based heuristics
              contentToSend = ""; // Empty - server will use filename only
            }

            const response = await fetch("/api/documents/categorize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: file.fileName,
                fileContent: contentToSend,
                mimeType: file.fileType,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                // Update this specific file with AI results
                // Map the AI response to our dropdown values
                const mappedMedium = mapLanguageToMedium(result.data.language);
                const mappedSubject = mapAISubjectToId(result.data.subject);
                const mappedDocType = uploadType === "jumbled" 
                  ? mapAIDocumentType(result.data.documentType)
                  : uploadType;

                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === file.id
                      ? {
                          ...f,
                          documentName:
                            result.data.suggestedTitle ||
                            file.fileName.replace(/\.[^/.]+$/, ""),
                          medium: mappedMedium,
                          subject: mappedSubject,
                          documentType: mappedDocType || uploadType,
                          aiCategorized: !!(mappedMedium && mappedSubject),
                          aiConfidence: result.data.subjectConfidence || 0.5,
                          isProcessing: false,
                        }
                      : f,
                  ),
                );

                // Show toast for first successful categorization
                if (i === 0) {
                  toast.success("AI is analyzing your documents", {
                    description: "Results will appear as they're ready.",
                    icon: <Sparkles className="h-4 w-4 text-blue-500" />,
                  });
                }
                continue;
              }
            }
          } catch (error) {
            console.error(`Categorization error for file ${i}:`, error);
          }

          // If categorization failed, just mark as not processing
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    documentName: file.fileName.replace(/\.[^/.]+$/, ""),
                    isProcessing: false,
                  }
                : f,
            ),
          );
        }

        // Clear IndexedDB after processing
        await clearStoredFiles();
      } catch (error) {
        console.error("Error loading files:", error);
        toast.error("Failed to load files. Please try again.");
        router.push("/upload");
      }
    };

    loadAndCategorize();
  }, [router]);

  const filteredSubjects = useCallback((searchTerm: string) => {
    if (!searchTerm) return SUBJECTS;
    return SUBJECTS.filter((subject) =>
      subject.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, []);

  const updateFile = (id: string, field: string, value: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? { ...file, [field]: value, aiCategorized: false }
          : file,
      ),
    );
  };

  const isAllFieldsValid = files.every(
    (file) =>
      !file.isProcessing &&
      file.documentName &&
      file.medium &&
      file.subject &&
      file.documentType,
  );

  const handleUpload = async () => {
    if (!isAllFieldsValid) {
      toast.error("Please fill in all required fields for all files");
      return;
    }

    setIsUploading(true);

    try {
      // Upload each file to the API
      const uploadPromises = files.map(async (file) => {
        // Convert base64 back to File object
        const byteCharacters = atob(file.fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.fileType });
        const fileObj = new File([blob], file.fileName, {
          type: file.fileType,
        });

        // Create FormData for upload
        const formData = new FormData();
        formData.append("files", fileObj);
        formData.append("title", file.documentName);
        formData.append(
          "documentType",
          file.documentType === "notes" ? "short_note" : file.documentType,
        );
        formData.append("subject", file.subject);
        formData.append("medium", file.medium.toLowerCase());

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Upload failed");
        }
        return result;
      });

      await Promise.all(uploadPromises);

      setIsUploading(false);
      setUploadSuccess(true);

      // Show success toast with appreciation message
      toast.success("Documents uploaded successfully! 🎉", {
        description:
          "Thank you for your time and generosity. We truly appreciate your support in helping fellow students succeed!",
        duration: 6000,
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard?tab=uploads");
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.",
      );
    }
  };

  // Initial loading state
  if (loadingFiles) {
    return (
      <div className="min-h-screen bg-white">
        <SharedNavbar
          variant="back"
          backHref="/upload"
          backLabel="Back to Upload"
        />
        <div className="h-24" />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="mt-4 text-slate-500">Loading your files...</p>
        </div>
      </div>
    );
  }

  // Show success state
  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <SharedNavbar
          variant="back"
          backHref="/upload"
          backLabel="Back to Upload"
        />
        <div className="h-24" />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">
            Upload Successful!
          </h2>
          <p className="mb-6 max-w-md text-center text-slate-500">
            Your documents are now being processed and will be available for
            other students soon.
          </p>
          <p className="text-sm text-slate-400">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SharedNavbar
        variant="back"
        backHref="/upload"
        backLabel="Back to Upload"
      />

      {/* Spacer */}
      <div className="h-24" />

      <main className="mx-auto max-w-4xl px-4 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Complete Document Details
          </h1>
          <p className="mt-2 text-slate-500">
            Fill in the details for {files.length} document
            {files.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Files Container */}
        <div className="space-y-4">
          {files.map((file, index) => (
            <div
              key={file.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all"
            >
              <div className="flex gap-6">
                {/* Left - Document Preview */}
                <div className="flex shrink-0 items-start">
                  <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                    {file.isProcessing ? (
                      <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                    ) : (
                      <FileText className="h-12 w-12 text-blue-400" />
                    )}
                  </div>
                </div>

                {/* Right - Form Fields */}
                <div className="flex-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {file.fileName}
                      </h3>
                      {file.isProcessing ? (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analyzing...
                        </span>
                      ) : file.aiCategorized ? (
                        <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          <Sparkles className="h-3 w-3" />
                          AI Suggested
                        </span>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                      {DOCUMENT_TYPES[uploadType] || uploadType}
                    </span>
                  </div>

                  {/* Skeleton loading for form fields */}
                  {file.isProcessing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="mb-2 h-4 w-24" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div>
                          <Skeleton className="mb-2 h-4 w-24" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="mb-2 h-4 w-16" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div>
                          <Skeleton className="mb-2 h-4 w-16" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* AI Confidence Indicator */}
                      {file.aiCategorized && file.aiConfidence && (
                        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 border border-purple-100">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-purple-700">
                            AI detected:{" "}
                            <span className="font-medium">
                              {getSubjectDisplayName(file.subject) ||
                                file.subject}
                            </span>{" "}
                            in{" "}
                            <span className="font-medium">{file.medium}</span>
                            <span className="ml-2 text-purple-500">
                              ({Math.round((file.aiConfidence || 0.5) * 100)}%
                              confidence)
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Row 1: Document Name and Document Type (Read-only) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-slate-700">
                            Document Name *
                          </Label>
                          <Input
                            placeholder="e.g., Mathematics Notes Chapter 1"
                            value={file.documentName}
                            onChange={(e) =>
                              updateFile(
                                file.id,
                                "documentName",
                                e.target.value,
                              )
                            }
                            className="h-11 rounded-lg border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-slate-700">
                            Document Type *
                          </Label>
                          <Select
                            value={file.documentType}
                            onValueChange={(value) =>
                              updateFile(file.id, "documentType", value)
                            }
                          >
                            <SelectTrigger className="h-11 rounded-lg border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-500 focus:ring-blue-500 [&>span]:text-slate-900">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl bg-white border-slate-200 shadow-lg">
                              {DOCUMENT_TYPE_OPTIONS.map((type) => (
                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                  className="text-slate-900 font-medium cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                                >
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 2: Medium and Subject Dropdowns */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-slate-700">
                            Medium *
                          </Label>
                          <Select
                            value={file.medium}
                            onValueChange={(value) =>
                              updateFile(file.id, "medium", value)
                            }
                          >
                            <SelectTrigger className="h-11 rounded-lg border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-500 focus:ring-blue-500 [&>span]:text-slate-900">
                              <SelectValue placeholder="Select medium" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl bg-white border-slate-200 shadow-lg">
                              {MEDIUMS.map((medium) => (
                                <SelectItem
                                  key={medium}
                                  value={medium}
                                  className="text-slate-900 font-medium cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                                >
                                  {medium}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-slate-700">
                            Subject *
                          </Label>
                          <Select
                            value={file.subject}
                            onValueChange={(value) =>
                              updateFile(file.id, "subject", value)
                            }
                          >
                            <SelectTrigger className="h-11 rounded-lg border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-500 focus:ring-blue-500 [&>span]:text-slate-900">
                              <SelectValue placeholder="Search & select subject" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl bg-white border-slate-200 shadow-lg">
                              <div className="sticky top-0 border-b border-slate-200 bg-white p-2 z-10">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                  <Input
                                    placeholder="Search subjects..."
                                    value={subjectSearch[file.id] || ""}
                                    onChange={(e) =>
                                      setSubjectSearch((prev) => ({
                                        ...prev,
                                        [file.id]: e.target.value,
                                      }))
                                    }
                                    className="h-9 rounded-lg pl-9 text-sm text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.target.select()}
                                    autoComplete="off"
                                  />
                                </div>
                              </div>
                              <div className="max-h-[200px] overflow-y-auto">
                                {filteredSubjects(
                                  subjectSearch[file.id] || "",
                                ).map((subject) => (
                                  <SelectItem
                                    key={subject.id}
                                    value={subject.id}
                                    className="text-slate-900 font-semibold cursor-pointer hover:bg-blue-100 hover:text-slate-900 focus:bg-blue-100 focus:text-slate-900"
                                  >
                                    {subject.displayName}
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Button */}
        <div className="mt-8">
          <Button
            onClick={handleUpload}
            disabled={!isAllFieldsValid || isUploading}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload Document{files.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
