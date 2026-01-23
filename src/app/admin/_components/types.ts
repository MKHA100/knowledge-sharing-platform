// Admin Dashboard Types and Interfaces

import type { DocumentWithUploader } from "@/types";
import type { LucideIcon } from "lucide-react";

// Downvoted document type
export interface DownvotedDocument {
  id: string;
  title: string;
  subject?: string;
  uploader_name?: string;
  uploader_avatar?: string;
  downvotes?: number;
  upvotes?: number;
  downvote_count?: number;
  upvote_count?: number;
  view_count?: number;
  download_count?: number;
  created_at?: string;
  reason?: string;
  author?: {
    name?: string;
    avatar_url?: string;
  };
}

// Admin user type
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  upload_count?: number;
  download_count?: number;
  comment_count?: number;
  created_at?: string;
  last_active?: string;
}

// Admin stats type
export interface AdminStats {
  totalDocuments: number;
  totalUsers: number;
  downloadsToday: number;
  uploadsToday: number;
  pendingReview: number;
}

// Navigation item type
export interface NavItem {
  id: string;
  label: string;
  icon: string; // Icon name as string for flexibility
  badgeKey?: "pending" | "pendingImages" | "downvoted" | "thankYou" | "recommendations";
}

// Document type for complement section
export interface Document {
  id: string;
  title: string;
  subject?: string;
  uploader_id?: string;
  views?: number;
  downloads?: number;
  upvotes?: number;
}

// User activity type
export interface UserActivity {
  id: string;
  type: "upload" | "download" | "like" | "comment";
  document: string;
  timestamp: string;
  details: string;
}

// Admin context state
export interface AdminState {
  activeSection: string;
  setActiveSection: (section: string) => void;
  apiDocuments: DocumentWithUploader[];
  setApiDocuments: React.Dispatch<React.SetStateAction<DocumentWithUploader[]>>;
  apiPending: DocumentWithUploader[];
  setApiPending: React.Dispatch<React.SetStateAction<DocumentWithUploader[]>>;
  apiDownvoted: DownvotedDocument[];
  setApiDownvoted: React.Dispatch<React.SetStateAction<DownvotedDocument[]>>;
  apiUsers: AdminUser[];
  setApiUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  apiStats: AdminStats | null;
  setApiStats: React.Dispatch<React.SetStateAction<AdminStats | null>>;
  handleApprove: (id: string) => Promise<void>;
  handleReject: (id: string) => Promise<void>;
  handleDeleteDocument: (id: string, title: string) => Promise<void>;
}

// Stat card type
export interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
}
