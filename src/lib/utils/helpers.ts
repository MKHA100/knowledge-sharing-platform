import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export function isValidFileType(filename: string): boolean {
  const validExtensions = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
  return validExtensions.includes(getFileExtension(filename));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function generateShareableUrl(documentId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/doc/${documentId}`;
}

// Limit notifications per user
export const MAX_NOTIFICATIONS_PER_USER = 5;

export function shouldSendNotification(
  existingNotificationCount: number,
  notificationType: string,
): boolean {
  // Always send for important types
  const alwaysSend = ["complement", "document_rejected"];
  if (alwaysSend.includes(notificationType)) return true;

  return existingNotificationCount < MAX_NOTIFICATIONS_PER_USER;
}
