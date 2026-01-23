// Database enums
export type DocumentStatus = "pending" | "approved" | "rejected";
export type DocumentType = "book" | "short_note" | "paper" | "jumbled";
export type MediumType = "sinhala" | "english" | "tamil";

// All 52 O-Level subjects as a flat list
export type SubjectType =
  // Religion subjects
  | "buddhism"
  | "catholicism"
  | "saivanery"
  | "christianity"
  | "islam"
  // Core subjects
  | "english"
  | "sinhala_language_literature"
  | "tamil_language_literature"
  | "mathematics"
  | "history"
  | "science"
  // Category I subjects
  | "civic_education"
  | "business_accounting"
  | "geography"
  | "entrepreneurship"
  | "second_language_sinhala"
  | "second_language_tamil"
  | "pali"
  | "sanskrit"
  | "french"
  | "german"
  | "hindi"
  | "japanese"
  | "arabic"
  | "korean"
  | "chinese"
  | "russian"
  // Category II subjects
  | "music_oriental"
  | "music_western"
  | "music_carnatic"
  | "dancing_oriental"
  | "dancing_bharata"
  | "english_literary_texts"
  | "sinhala_literary_texts"
  | "tamil_literary_texts"
  | "arabic_literary_texts"
  | "drama_theatre"
  // Category III subjects
  | "ict"
  | "agriculture_food_technology"
  | "aquatic_bioresources"
  | "art_crafts"
  | "home_economics"
  | "health_physical_education"
  | "communication_media"
  | "design_construction"
  | "design_mechanical"
  | "design_electrical_electronic";

export type HappinessLevel = "helpful" | "very_helpful" | "life_saver";
export type NotificationType =
  | "comment_received"
  | "download_milestone"
  | "upload_processed"
  | "document_rejected"
  | "system_message"
  | "complement"
  | "thank_you";
export type UserRole = "user" | "admin";

// Database models (match schema.sql exactly)
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  uploader_id: string | null;
  file_path: string;
  file_size: number | null;
  page_count: number | null;
  // Categorization (simplified schema)
  type: DocumentType | null;
  subject: SubjectType | null;
  medium: MediumType | null;
  // Status
  status: DocumentStatus;
  rejection_reason: string | null;
  // Metrics
  upvotes: number;
  downvotes: number;
  views: number;
  downloads: number;
  // Flags
  is_featured: boolean;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithUploader extends Document {
  uploader_name: string | null;
  uploader_avatar: string | null;
  uploader_total_uploads?: number;
}

export interface Comment {
  id: string;
  document_id: string;
  user_id: string | null;
  admin_name: string | null;
  is_admin_complement: boolean;
  happiness: HappinessLevel;
  content: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface FailedSearch {
  id: string;
  query: string;
  normalized_query: string;
  subject: SubjectType | null;
  medium: MediumType | null;
  type: DocumentType | null;
  search_count: number;
  is_resolved: boolean;
  resolved_document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVote {
  id: string;
  user_id: string;
  document_id: string;
  vote_type: "upvote" | "downvote";
  created_at: string;
}

export interface UserDownload {
  id: string;
  user_id: string;
  document_id: string;
  created_at: string;
  is_unique: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Search types
export interface SearchFilters {
  query?: string;
  subject?: SubjectType;
  medium?: MediumType;
  documentType?: DocumentType;
  sortBy?: "newest" | "downloads" | "upvotes";
}

export interface SearchResult extends DocumentWithUploader {
  similarity_score: number;
}

// Upload types
export interface UploadResult {
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
}

// AI Categorization types
export interface AICategorization {
  documentType: DocumentType;
  subject: SubjectType;
  medium: MediumType;
  confidence: number;
  title: string;
  needsReview: boolean;
}

// Admin types
export interface AdminStats {
  totalDocuments: number;
  totalUsers: number;
  totalDownloads: number;
  pendingReview: number;
  downvotedDocuments: number;
}

export interface UserDetails extends User {
  uploadCount: number;
  downloadCount: number;
  commentsSent: number;
  commentsReceived: number;
  uploads: Document[];
  downloads: Document[];
}
