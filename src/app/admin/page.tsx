"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  ThumbsDown,
  MessageSquare,
  Search,
  Check,
  X,
  Edit,
  Eye,
  Layers,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Download,
  Upload,
  Send,
  Menu,
  ArrowUpDown,
  SlidersHorizontal,
  Heart,
  ThumbsUp,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import type { DocumentWithUploader } from "@/types";
import { ToastProvider } from "@/components/toast-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "pending", label: "Pending Review", icon: Clock, badgeKey: "pending" },
  { id: "documents", label: "All Documents", icon: FileText },
  { id: "users", label: "All Users", icon: Users },
  { id: "downvoted", label: "Downvoted", icon: ThumbsDown, badgeKey: "downvoted" },
  { id: "complement", label: "Send Complement", icon: MessageSquare },
];

// Type definitions for admin data
// PendingDocument uses DocumentWithUploader type from API
// DownvotedDocument uses similar structure

interface DownvotedDocument {
  id: string;
  title: string;
  uploader_name?: string;
  uploader_avatar?: string;
  downvotes: number;
  upvotes?: number;
  reason?: string;
}

interface AdminUser {
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

export default function AdminDashboard() {
  const router = useRouter();
  const messageRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [complementUser, setComplementUser] = useState("");
  const [complementSender, setComplementSender] = useState("");
  const [complementDocument, setComplementDocument] = useState("");
  const [complementMessage, setComplementMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documentSort, setDocumentSort] = useState("newest");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [complementDocPage, setComplementDocPage] = useState(1);
  const [complementDocSort, setComplementDocSort] = useState("most-likes");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const DOCS_PER_PAGE = 16;

  // Admin access state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API state
  const [apiDocuments, setApiDocuments] = useState<DocumentWithUploader[]>([]);
  const [apiPending, setApiPending] = useState<DocumentWithUploader[]>([]);
  const [apiDownvoted, setApiDownvoted] = useState<DownvotedDocument[]>([]);
  const [apiUsers, setApiUsers] = useState<AdminUser[]>([]);
  const [apiStats, setApiStats] = useState<{
    totalDocuments: number;
    totalUsers: number;
    downloadsToday: number;
    uploadsToday: number;
  } | null>(null);

  // Verify admin access and fetch data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        // First, try to fetch admin stats - this will fail with 403 if not admin
        const statsRes = await api.admin.stats();

        if (!statsRes.success) {
          // User is not an admin
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // User is admin, fetch remaining data
        setIsAdmin(true);
        setApiStats(statsRes.data);

        const [pendingRes, downvotedRes, usersRes, documentsRes] =
          await Promise.all([
            api.admin.pending(),
            api.admin.downvoted(),
            api.admin.users({}),
            api.documents.list({ limit: "100" }),
          ]);
        if (pendingRes.success && pendingRes.data)
          setApiPending(pendingRes.data);
        if (downvotedRes.success && downvotedRes.data)
          setApiDownvoted(downvotedRes.data);
        if (usersRes.success && usersRes.data) setApiUsers(usersRes.data.users || []);
        if (documentsRes.success && documentsRes.data)
          setApiDocuments(documentsRes.data);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const result = await api.admin.approve(id);
      if (result.success) {
        toast.success("Document approved and published!");
        // Remove from pending list
        setApiPending((prev) => prev.filter((doc) => doc.id !== id));
        // Add to documents list
        const approvedDoc = apiPending.find((doc) => doc.id === id);
        if (approvedDoc) {
          setApiDocuments((prev) => [{ ...approvedDoc, status: "approved" }, ...prev]);
        }
        // Update stats
        if (apiStats) {
          setApiStats({
            ...apiStats,
            pendingReview: Math.max(0, apiStats.pendingReview - 1),
            totalDocuments: apiStats.totalDocuments + 1,
          });
        }
      } else {
        toast.error(result.error || "Failed to approve document");
      }
    } catch (error) {
      toast.error("Failed to approve document");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const result = await api.admin.reject(id, "Does not meet quality standards");
      if (result.success) {
        toast.success("Document rejected");
        // Remove from pending list
        setApiPending((prev) => prev.filter((doc) => doc.id !== id));
        // Update stats
        if (apiStats) {
          setApiStats({
            ...apiStats,
            pendingReview: Math.max(0, apiStats.pendingReview - 1),
          });
        }
      } else {
        toast.error(result.error || "Failed to reject document");
      }
    } catch (error) {
      toast.error("Failed to reject document");
    }
  };

  const handleDeleteDocument = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const result = await api.documents.delete(id);
      if (result.success) {
        toast.success("Document deleted successfully");
        setApiDocuments((prev) => prev.filter((doc) => doc.id !== id));
        setApiDownvoted((prev) => prev.filter((doc) => doc.id !== id));
        if (apiStats) {
          setApiStats({
            ...apiStats,
            totalDocuments: Math.max(0, apiStats.totalDocuments - 1),
          });
        }
      } else {
        toast.error(result.error || "Failed to delete document");
      }
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const handleSendComplement = async () => {
    if (!complementUser || !complementMessage || !complementDocument) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Find the selected user and document
    const selectedUserData = apiUsers.find((u) => u.name === complementUser);
    const selectedDoc = apiDocuments.find((d) => d.title === complementDocument);

    if (!selectedUserData || !selectedDoc) {
      toast.error("Could not find user or document");
      return;
    }

    try {
      const result = await api.admin.complement({
        documentId: selectedDoc.id,
        userId: selectedUserData.id,
        senderDisplayName: complementSender || "A Fellow Student",
        happinessLevel: "very_helpful",
        message: complementMessage,
      });

      if (result.success) {
        toast.success(`Complement sent to ${complementUser}!`);
        setComplementUser("");
        setComplementSender("");
        setComplementDocument("");
        setComplementMessage("");
        setComplementDocPage(1);
        setComplementDocSort("most-likes");
      } else {
        toast.error(result.error || "Failed to send complement");
      }
    } catch (error) {
      toast.error("Failed to send complement");
    }
  };

  const stats = [
    {
      label: "Total Documents",
      value: apiStats?.totalDocuments?.toLocaleString() || "0",
      change: "+12%",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Users",
      value: apiStats?.totalUsers?.toLocaleString() || "0",
      change: "+8%",
      icon: Users,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Downloads Today",
      value: apiStats?.totalDownloads?.toLocaleString() || "0",
      change: "+24%",
      icon: Download,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pending Review",
      value: apiStats?.pendingReview?.toLocaleString() || "0",
      change: "",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  // Mock user activity data
  const userActivities = {
    "1": [
      {
        id: "a1",
        type: "upload",
        document: "Mathematics Advanced Notes",
        timestamp: "2025-01-18 14:30",
        details: "Short Notes",
      },
      {
        id: "a2",
        type: "download",
        document: "Science Practical Guide by Nimali Silva",
        timestamp: "2025-01-18 10:15",
        details: "",
      },
      {
        id: "a3",
        type: "like",
        document: "English Grammar Guide",
        timestamp: "2025-01-17 16:20",
        details: "",
      },
      {
        id: "a4",
        type: "comment",
        document: "ICT Programming Basics",
        timestamp: "2025-01-17 09:45",
        details: "Great resource, very helpful!",
      },
      {
        id: "a5",
        type: "upload",
        document: "Physics Motion Notes",
        timestamp: "2025-01-16 11:30",
        details: "Short Notes",
      },
      {
        id: "a6",
        type: "download",
        document: "History World War Notes by Kasun Rathnayake",
        timestamp: "2025-01-15 13:00",
        details: "",
      },
      {
        id: "a7",
        type: "like",
        document: "Chemistry Periodic Table",
        timestamp: "2025-01-14 17:30",
        details: "",
      },
    ],
    "2": [
      {
        id: "b1",
        type: "download",
        document: "Mathematics Advanced Notes by Ashan Fernando",
        timestamp: "2025-01-18 15:45",
        details: "",
      },
      {
        id: "b2",
        type: "like",
        document: "Science Practical Guide",
        timestamp: "2025-01-18 12:30",
        details: "",
      },
      {
        id: "b3",
        type: "upload",
        document: "Science Practical Guide",
        timestamp: "2025-01-17 14:20",
        details: "Past Paper",
      },
      {
        id: "b4",
        type: "comment",
        document: "Mathematics Advanced Notes",
        timestamp: "2025-01-16 10:15",
        details: "This helped me pass my exam!",
      },
      {
        id: "b5",
        type: "download",
        document: "English Vocabulary Builder by Ashan Fernando",
        timestamp: "2025-01-15 16:00",
        details: "",
      },
    ],
    "3": [
      {
        id: "c1",
        type: "upload",
        document: "English Grammar Guide",
        timestamp: "2025-01-18 09:00",
        details: "Book",
      },
      {
        id: "c2",
        type: "upload",
        document: "English Comprehension - Practice Set A",
        timestamp: "2025-01-17 11:30",
        details: "Past Paper",
      },
      {
        id: "c3",
        type: "like",
        document: "Mathematics Advanced Notes",
        timestamp: "2025-01-16 14:45",
        details: "",
      },
      {
        id: "c4",
        type: "upload",
        document: "English Vocabulary Builder - 500 Words",
        timestamp: "2025-01-15 10:20",
        details: "Short Notes",
      },
      {
        id: "c5",
        type: "comment",
        document: "Science Practical Guide",
        timestamp: "2025-01-14 16:30",
        details: "Well organized content",
      },
      {
        id: "c6",
        type: "upload",
        document: "Essay Writing Guide - Complete",
        timestamp: "2025-01-13 13:15",
        details: "Short Notes",
      },
      {
        id: "c7",
        type: "download",
        document: "ICT Programming Basics by Tharindu Perera",
        timestamp: "2025-01-12 15:00",
        details: "",
      },
      {
        id: "c8",
        type: "upload",
        document: "Shakespeare - Macbeth Analysis",
        timestamp: "2025-01-11 09:45",
        details: "Short Notes",
      },
    ],
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-lg font-medium text-slate-600">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">
              Access Denied
            </h1>
            <p className="max-w-md text-slate-500">
              You don&apos;t have permission to access the admin dashboard. This
              area is restricted to administrators only.
            </p>
          </div>
          <Button
            onClick={() => router.push("/")}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastProvider />
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">StudyShare</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    activeSection === item.id
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.badgeKey === "pending" && apiPending.length > 0 && (
                    <Badge
                      className={cn(
                        "ml-auto",
                        activeSection === item.id
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200",
                      )}
                    >
                      {apiPending.length}
                    </Badge>
                  )}
                  {item.badgeKey === "downvoted" && apiDownvoted.length > 0 && (
                    <Badge
                      className={cn(
                        "ml-auto",
                        activeSection === item.id
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-200",
                      )}
                    >
                      {apiDownvoted.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Back to Main Site */}
          <div className="border-t border-slate-200 p-4">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full gap-2 rounded-xl bg-white"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to Site
              </Button>
            </Link>
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Dashboard Overview
                </h1>
                <p className="text-slate-500">
                  Welcome back! Here's what's happening today.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            stat.color,
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {stat.change}
                        </span>
                      </div>
                      <p className="mt-4 text-3xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 font-semibold text-slate-900">
                    Pending Review
                  </h2>
                  <div className="space-y-3">
                    {apiPending.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-8">
                        <Check className="mb-2 h-8 w-8 text-emerald-500" />
                        <p className="text-sm text-slate-500">All caught up! No pending reviews.</p>
                      </div>
                    ) : (
                    apiPending.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                            <FileText className="h-5 w-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.type === "short_note" && "Short Notes"}
                              {item.type === "paper" && "Paper"}
                              {item.type === "book" && "Book"}
                              {!item.type && "Pending classification"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveSection("pending")}
                          className="rounded-lg bg-white"
                        >
                          Review
                        </Button>
                      </div>
                    )))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 font-semibold text-slate-900">
                    Downvoted Documents
                  </h2>
                  <div className="space-y-3">
                    {apiDownvoted.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-8">
                        <ThumbsUp className="mb-2 h-8 w-8 text-emerald-500" />
                        <p className="text-sm text-slate-500">No downvoted documents!</p>
                      </div>
                    ) : (
                    apiDownvoted.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
                            <ThumbsDown className="h-5 w-5 text-rose-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.downvotes} downvotes / {item.upvotes}{" "}
                              upvotes
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveSection("downvoted")}
                          className="rounded-lg bg-white"
                        >
                          Review
                        </Button>
                      </div>
                    )))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Review Section */}
          {activeSection === "pending" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Pending Review
                </h1>
                <p className="text-slate-500">
                  Documents that need your attention
                </p>
              </div>

              <div className="space-y-4">
                {apiPending.map((item) => (
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
                            <h3 className="font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <div className="mt-2 flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={
                                    item.uploader_avatar || "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                                  {item.uploader_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-slate-500">
                                {item.uploader_name || "Anonymous"} (
                                {item.uploader_total_uploads || 0} uploads)
                              </span>
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

                        <div className="mb-4 flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-slate-500">Type: </span>
                            <span className="font-medium capitalize text-slate-900">
                              {item.type || "Unknown"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-500">Subject: </span>
                            <span className="font-medium capitalize text-slate-900">
                              {item.subject || "Uncategorized"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                            onClick={() => handleApprove(item.id)}
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
                            onClick={() => handleReject(item.id)}
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
            </div>
          )}

          {/* All Documents Section */}
          {activeSection === "documents" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    All Documents
                  </h1>
                  <p className="text-slate-500">
                    Browse and manage all uploaded documents
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search documents..."
                    className="rounded-xl pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter & Sort Bar */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Filter</span>
                    </div> */}
                    <Select
                      value={documentFilter}
                      onValueChange={setDocumentFilter}
                    >
                      <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-200 bg-white text-sm shadow-sm transition-colors hover:border-blue-300">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="sinhala">Sinhala</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="ict">ICT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Right: Sort */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <ArrowUpDown className="h-4 w-4" />
                      <span>Sort</span>
                    </div>
                    <Select
                      value={documentSort}
                      onValueChange={setDocumentSort}
                    >
                      <SelectTrigger className="h-9 w-[160px] rounded-lg border-slate-200 bg-white text-sm shadow-sm transition-colors hover:border-blue-300">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="downloads">
                          Most Downloads
                        </SelectItem>
                        <SelectItem value="views">Most Views</SelectItem>
                        <SelectItem value="upvotes">Most Upvotes</SelectItem>
                        <SelectItem value="title-asc">Title A-Z</SelectItem>
                        <SelectItem value="title-desc">Title Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-900">
                        Title
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900">
                        Uploader
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900">
                        Category
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-900">
                        Downloads
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-900">
                        Views
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-900">
                        Upvotes
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900">
                        Date
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiDocuments
                      .filter(
                        (doc) =>
                          doc.title
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) &&
                          (documentFilter === "all" ||
                            doc.type === documentFilter),
                      )
                      .sort((a, b) => {
                        switch (documentSort) {
                          case "newest":
                            return (
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime()
                            );
                          case "oldest":
                            return (
                              new Date(a.created_at).getTime() -
                              new Date(b.created_at).getTime()
                            );
                          case "downloads":
                            return b.downloads - a.downloads;
                          case "views":
                            return b.views - a.views;
                          case "upvotes":
                            return b.upvotes - a.upvotes;
                          case "title-asc":
                            return a.title.localeCompare(b.title);
                          case "title-desc":
                            return b.title.localeCompare(a.title);
                          default:
                            return 0;
                        }
                      })
                      .map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-slate-50">
                          <TableCell className="max-w-xs truncate font-medium text-slate-900">
                            {doc.title}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {doc.uploader_name || "Anonymous"}
                          </TableCell>
                          <TableCell className="capitalize text-slate-600">
                            {doc.type || "Unknown"}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {doc.downloads}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {doc.views}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {doc.upvotes}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-lg"
                                onClick={() => window.open(`/doc/${doc.id}`, "_blank")}
                                title="View document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-lg text-rose-500 hover:text-rose-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id, doc.title);
                                }}
                                title="Delete document"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* All Users Section */}
          {activeSection === "users" &&
            (() => {
              const selectedUser = selectedUserId
                ? apiUsers.find((u) => u.id === selectedUserId)
                : null;
              const userActivitiesData = selectedUserId
                ? userActivities[
                    selectedUserId as keyof typeof userActivities
                  ] || []
                : [];

              const filteredActivities =
                activityFilter === "all"
                  ? userActivitiesData
                  : userActivitiesData.filter(
                      (activity) => activity.type === activityFilter,
                    );

              return (
                <div className="space-y-6">
                  {/* Header with Back Button */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      {selectedUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(null);
                            setActivityFilter("all");
                          }}
                          className="gap-2 rounded-lg"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Back
                        </Button>
                      )}
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                          {selectedUser
                            ? `${selectedUser.name}'s Activity`
                            : "All Users"}
                        </h1>
                        <p className="text-slate-500">
                          {selectedUser
                            ? "View complete user activity log"
                            : "Manage users and view their activity"}
                        </p>
                      </div>
                    </div>
                    {!selectedUser && (
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search users..."
                          className="rounded-xl pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* User List Table */}
                  {!selectedUser && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-slate-900">
                              User
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900">
                              Email
                            </TableHead>
                            <TableHead className="text-right font-semibold text-slate-900">
                              Uploads
                            </TableHead>
                            <TableHead className="text-right font-semibold text-slate-900">
                              Downloads
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900">
                              Joined
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900">
                              Last Active
                            </TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {apiUsers
                            .filter(
                              (user) =>
                                user.name
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()) ||
                                user.email
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()),
                            )
                            .map((user) => (
                              <TableRow
                                key={user.id}
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarImage
                                        src={
                                          (user as { avatar_url?: string })
                                            .avatar_url || "/placeholder.svg"
                                        }
                                      />
                                      <AvatarFallback className="bg-blue-100 text-sm text-blue-700">
                                        {user.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-slate-900">
                                      {user.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-slate-600">
                                  {user.email}
                                </TableCell>
                                <TableCell className="text-right text-slate-600">
                                  {user.upload_count || 0}
                                </TableCell>
                                <TableCell className="text-right text-slate-600">
                                  {user.download_count || 0}
                                </TableCell>
                                <TableCell className="text-slate-600">
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                                </TableCell>
                                <TableCell className="text-slate-600">
                                  {user.last_active ? new Date(user.last_active).toLocaleDateString() : "-"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* User Activity Detail View */}
                  {selectedUser && (
                    <>
                      {/* User Info Card */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={
                                (selectedUser as { avatar_url?: string })
                                  .avatar_url || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="bg-blue-100 text-xl text-blue-700">
                              {selectedUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900">
                              {selectedUser.name}
                            </h2>
                            <p className="text-slate-500">
                              {selectedUser.email}
                            </p>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-900">
                                {selectedUser.upload_count || 0}
                              </p>
                              <p className="text-sm text-slate-500">Uploads</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-900">
                                {selectedUser.download_count || 0}
                              </p>
                              <p className="text-sm text-slate-500">
                                Downloads
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Activity Filter */}
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex items-center gap-3">
                          <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-600">
                            Filter Activity
                          </span>
                        </div>
                        <Select
                          value={activityFilter}
                          onValueChange={setActivityFilter}
                        >
                          <SelectTrigger className="h-9 w-[160px] rounded-lg border-slate-200 bg-white text-sm shadow-sm">
                            <SelectValue placeholder="Activity type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">All Activities</SelectItem>
                            <SelectItem value="upload">Uploads</SelectItem>
                            <SelectItem value="download">Downloads</SelectItem>
                            <SelectItem value="like">Likes</SelectItem>
                            <SelectItem value="comment">Comments</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Activity Log Table */}
                      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-semibold text-slate-900">
                                Activity Type
                              </TableHead>
                              <TableHead className="font-semibold text-slate-900">
                                Document
                              </TableHead>
                              <TableHead className="font-semibold text-slate-900">
                                Details
                              </TableHead>
                              <TableHead className="font-semibold text-slate-900">
                                Timestamp
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredActivities.length > 0 ? (
                              filteredActivities.map((activity) => (
                                <TableRow
                                  key={activity.id}
                                  className="hover:bg-slate-50"
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {activity.type === "upload" && (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                          <Upload className="h-4 w-4 text-blue-600" />
                                        </div>
                                      )}
                                      {activity.type === "download" && (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                          <Download className="h-4 w-4 text-emerald-600" />
                                        </div>
                                      )}
                                      {activity.type === "like" && (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                                          <Heart className="h-4 w-4 text-rose-600" />
                                        </div>
                                      )}
                                      {activity.type === "comment" && (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                                          <MessageSquare className="h-4 w-4 text-violet-600" />
                                        </div>
                                      )}
                                      <span className="font-medium capitalize text-slate-900">
                                        {activity.type}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-slate-900">
                                    {activity.document}
                                  </TableCell>
                                  <TableCell className="text-slate-600">
                                    {activity.details || "-"}
                                  </TableCell>
                                  <TableCell className="text-slate-600">
                                    {activity.timestamp}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="h-32 text-center"
                                >
                                  <div className="flex flex-col items-center justify-center text-slate-500">
                                    <FileText className="mb-2 h-8 w-8 text-slate-300" />
                                    <p className="text-sm">
                                      No{" "}
                                      {activityFilter !== "all"
                                        ? activityFilter
                                        : ""}{" "}
                                      activities found
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

          {/* Downvoted Section */}
          {activeSection === "downvoted" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Downvoted Documents
                </h1>
                <p className="text-slate-500">
                  Documents with a high downvote ratio that may need review
                </p>
              </div>

              <div className="space-y-4">
                {apiDownvoted.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row">
                      <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-xl bg-slate-100 lg:w-40">
                        <FileText className="h-10 w-10 text-slate-300" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={item.uploader_avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                              {item.uploader_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-slate-500">
                            {item.uploader_name || "Anonymous"}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-6">
                          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1.5">
                            <ThumbsDown className="h-4 w-4 text-rose-500" />
                            <span className="font-medium text-rose-700">
                              {item.downvotes}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium text-emerald-700">
                              {item.upvotes}
                            </span>
                          </div>
                          <div className="rounded-lg bg-slate-100 px-3 py-1.5">
                            <span className="text-sm text-slate-600">
                              Ratio:{" "}
                              <span className="font-medium text-rose-600">
                                {(
                                  (item.downvotes /
                                    ((item.upvotes || 0) + item.downvotes)) *
                                  100
                                ).toFixed(0)}
                                %
                              </span>{" "}
                              negative
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 rounded-lg bg-white"
                            onClick={() => window.open(`/doc/${item.id}`, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                            View Document
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 rounded-lg bg-white text-rose-500 hover:text-rose-600"
                            onClick={() => handleDeleteDocument(item.id, item.title)}
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Complement Section */}
          {activeSection === "complement" &&
            (() => {
              // Get documents for selected user
              const selectedUserData = apiUsers.find(
                (u) => u.name === complementUser,
              );
              const userDocuments = complementUser
                ? apiDocuments.filter(
                    (doc) => doc.uploader_name === complementUser,
                  )
                : [];

              // Sort documents
              const sortedDocs = [...userDocuments].sort((a, b) => {
                switch (complementDocSort) {
                  case "most-likes":
                    return b.upvotes - a.upvotes;
                  case "least-likes":
                    return a.upvotes - b.upvotes;
                  case "most-comments":
                    return b.downloads - a.downloads;
                  case "least-comments":
                    return a.downloads - b.downloads;
                  default:
                    return 0;
                }
              });

              const totalDocs = sortedDocs.length;
              const totalPages = Math.ceil(totalDocs / DOCS_PER_PAGE);
              const paginatedDocs = sortedDocs.slice(
                (complementDocPage - 1) * DOCS_PER_PAGE,
                complementDocPage * DOCS_PER_PAGE,
              );
              const startDoc = (complementDocPage - 1) * DOCS_PER_PAGE + 1;
              const endDoc = Math.min(
                complementDocPage * DOCS_PER_PAGE,
                totalDocs,
              );

              return (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Send Complement
                    </h1>
                    <p className="text-slate-500">
                      Send an encouraging message to a user as admin-created
                      feedback
                    </p>
                  </div>

                  {/* Step 1: Select User */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        1
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Select User
                      </h2>
                    </div>

                    <Select
                      value={complementUser}
                      onValueChange={(value) => {
                        setComplementUser(value);
                        setComplementDocument("");
                        setComplementDocPage(1);
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Search and select a user..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <div className="sticky top-0 border-b border-slate-200 bg-white p-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              placeholder="Search users..."
                              value={userSearchQuery}
                              onChange={(e) =>
                                setUserSearchQuery(e.target.value)
                              }
                              className="h-9 rounded-lg pl-9 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {apiUsers
                            .filter(
                              (user) =>
                                user.name
                                  .toLowerCase()
                                  .includes(userSearchQuery.toLowerCase()) ||
                                user.email
                                  .toLowerCase()
                                  .includes(userSearchQuery.toLowerCase()),
                            )
                            .map((user) => (
                              <SelectItem
                                key={user.id}
                                value={user.name}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={
                                        (user as { avatar_url?: string })
                                          .avatar_url || "/placeholder.svg"
                                      }
                                    />
                                    <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {user.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {user.email}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          {apiUsers.filter(
                            (user) =>
                              user.name
                                .toLowerCase()
                                .includes(userSearchQuery.toLowerCase()) ||
                              user.email
                                .toLowerCase()
                                .includes(userSearchQuery.toLowerCase()),
                          ).length === 0 && (
                            <div className="py-6 text-center text-sm text-slate-500">
                              No users found
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Select Document - Only show when user is selected */}
                  {complementUser && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            2
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                              Select Document
                            </h2>
                            <p className="text-sm text-slate-500">
                              Showing{" "}
                              <span className="font-medium text-slate-700">
                                {startDoc}-{endDoc}
                              </span>{" "}
                              of{" "}
                              <span className="font-medium text-slate-700">
                                {totalDocs}
                              </span>{" "}
                              documents by {complementUser}
                            </p>
                          </div>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                          <Select
                            value={complementDocSort}
                            onValueChange={setComplementDocSort}
                          >
                            <SelectTrigger className="h-9 w-[160px] rounded-lg border-slate-200 bg-slate-50 text-sm">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="most-likes">
                                Most Likes
                              </SelectItem>
                              <SelectItem value="least-likes">
                                Least Likes
                              </SelectItem>
                              <SelectItem value="most-comments">
                                Most Comments
                              </SelectItem>
                              <SelectItem value="least-comments">
                                Least Comments
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Document Grid */}
                      {totalDocs > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {paginatedDocs.map((doc) => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => {
                                  setComplementDocument(doc.title);
                                  messageRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                                }}
                                className={cn(
                                  "group relative overflow-hidden rounded-xl border-2 bg-slate-50 p-3 text-left transition-all hover:border-blue-400 hover:shadow-lg",
                                  complementDocument === doc.title
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-slate-200",
                                )}
                              >
                                {/* Document Preview */}
                                <div className="relative mb-3 flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                                  <FileText className="h-8 w-8 text-slate-400" />
                                  {complementDocument === doc.title && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-500/10">
                                      <Check className="h-8 w-8 text-blue-600" />
                                    </div>
                                  )}
                                </div>

                                {/* Title */}
                                <h3 className="mb-2 line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-blue-600">
                                  {doc.title}
                                </h3>

                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="font-medium">
                                      {doc.upvotes}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Download className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="font-medium">
                                      {doc.downloads || 0}
                                    </span>
                                  </div>
                                </div>

                                {/* Highlight badge for popular documents */}
                                {doc.upvotes > 50 && (
                                  <div className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Popular
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setComplementDocPage((p) =>
                                    Math.max(1, p - 1),
                                  )
                                }
                                disabled={complementDocPage === 1}
                                className="gap-1 rounded-lg"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>
                              <div className="flex items-center gap-1 px-3">
                                {Array.from(
                                  { length: totalPages },
                                  (_, i) => i + 1,
                                ).map((page) => (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => setComplementDocPage(page)}
                                    className={cn(
                                      "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                                      complementDocPage === page
                                        ? "bg-blue-500 text-white"
                                        : "text-slate-600 hover:bg-slate-100",
                                    )}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setComplementDocPage((p) =>
                                    Math.min(totalPages, p + 1),
                                  )
                                }
                                disabled={complementDocPage === totalPages}
                                className="gap-1 rounded-lg"
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-12">
                          <FileText className="mb-3 h-12 w-12 text-slate-300" />
                          <p className="text-sm text-slate-500">
                            This user hasn't uploaded any documents yet
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Write Message - Only show when document is selected */}
                  {complementDocument && (
                    <div
                      ref={messageRef}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                          3
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Write Message
                        </h2>
                      </div>

                      {/* Selected document preview */}
                      <div className="mb-5 flex items-center gap-3 rounded-xl bg-blue-50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {complementDocument}
                          </p>
                          <p className="text-xs text-slate-500">
                            Sending complement for this document
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setComplementDocument("")}
                          className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Display as (Sender Name)
                          </label>
                          <Input
                            placeholder="e.g., 'A Fellow Student' or leave empty for Anonymous"
                            value={complementSender}
                            onChange={(e) =>
                              setComplementSender(e.target.value)
                            }
                            className="rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Message *
                          </label>
                          <Textarea
                            placeholder="Write an encouraging message..."
                            value={complementMessage}
                            onChange={(e) =>
                              setComplementMessage(e.target.value)
                            }
                            className="min-h-[120px] rounded-xl"
                          />
                        </div>

                        <Button
                          onClick={handleSendComplement}
                          className="w-full gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                          disabled={!complementUser || !complementMessage}
                        >
                          <Send className="h-4 w-4" />
                          Send Complement
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </main>
      </div>
    </>
  );
}
