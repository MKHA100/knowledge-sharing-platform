import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateFileName(originalName: string): string {
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  return `${nameWithoutExt}_${timestamp}_${uuid}.${extension}`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
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
