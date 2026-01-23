"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Download,
  Bell,
  Settings,
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Trash2,
  Share2,
  BarChart3,
  Check,
} from "lucide-react";
import { SharedNavbar } from "@/components/shared-navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppProvider, useApp } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";
import { LoginModal } from "@/components/login-modal";
import { api } from "@/lib/api/client";
import type { DocumentWithUploader } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Loading from "./loading";

interface Notification {
  id: string;
  type: "comment" | "download" | "system" | "thank_you";
  message: string;
  timestamp: string;
  read: boolean;
  title?: string;
  fullMessage?: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const {
    user,
    setUser,
    setHasNewNotification,
    isLoggedIn,
    setShowLoginModal,
    setSelectedDocument,
  } = useApp();
  const [activeTab, setActiveTab] = useState(tabParam || "uploads");
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    [],
  );
  const [userUploads, setUserUploads] = useState<DocumentWithUploader[]>([]);
  const [userDownloads, setUserDownloads] = useState<DocumentWithUploader[]>(
    [],
  );
  const [userLiked, setUserLiked] = useState<DocumentWithUploader[]>([]);
  const [notificationsView, setNotificationsView] = useState<"unread" | "read">("unread");
  const [loading, setLoading] = useState(true);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Fetch user data from API only if logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [uploadsRes, downloadsRes, notificationsRes, likedRes] = await Promise.all([
          api.user.uploads(),
          api.user.downloads(),
          api.notifications.list(),
          api.user.liked(),
        ]);
        if (uploadsRes.success) setUserUploads(uploadsRes.data || []);
        if (downloadsRes.success) setUserDownloads(downloadsRes.data || []);
        if (likedRes.success) setUserLiked(likedRes.data || []);
        if (notificationsRes.success) {
          console.log("Notifications response:", notificationsRes);
          const notificationsData = notificationsRes.data?.notifications || notificationsRes.data || [];
          console.log("Notifications data to format:", notificationsData);
          const formatted = (notificationsData).map(
            (n: {
              id: string;
              type: string;
              title?: string;
              message: string;
              created_at: string;
              is_read: boolean;
            }) => ({
              id: n.id,
              type: n.type as "comment" | "download" | "system" | "thank_you",
              message: n.type === "thank_you" ? `${n.title}\n${n.message}` : (n.title || n.message),
              fullMessage: n.message,
              title: n.title,
              timestamp: new Date(n.created_at).toLocaleDateString(),
              read: n.is_read,
            }),
          );
          console.log("Formatted notifications:", formatted);
          setNotificationsList(formatted);
          setHasNewNotification(formatted.some((n: Notification) => !n.read));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [isLoggedIn, setHasNewNotification]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      
      if (response.ok) {
        setNotificationsList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        const hasUnread = notificationsList.some((n) => n.id !== id && !n.read);
        setHasNewNotification(hasUnread);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notificationsList.filter(n => !n.read).map(n => n.id);
      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/notifications/${id}/read`, { method: "POST" })
        )
      );
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      setHasNewNotification(false);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteAccount = () => {
    setUser(null);
    toast.success("Account deleted. Your uploads will remain as Anonymous.");
  };

  const handleShare = async (docId: string) => {
    const url = `${window.location.origin}/browse?doc=${docId}`;
    
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
  
  const handleOpenDocument = async (docId: string) => {
    try {
      const result = await api.documents.download(docId);
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error("Failed to open document");
      }
    } catch (error) {
      toast.error("Failed to open document");
    }
  };
  
  const handleDeleteClick = (docId: string) => {
    setDocumentToDelete(docId);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== "delete" || !documentToDelete) return;
    
    try {
      const response = await fetch(`/api/documents/${documentToDelete}`, {
        method: "DELETE",
      });
      const result = await response.json();
      
      if (result.success) {
        setUserUploads((prev) => prev.filter((d) => d.id !== documentToDelete));
        toast.success("Document deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete document");
      }
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      setDeleteConfirmText("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SharedNavbar />

      {/* Spacer for fixed navbar */}
      <div className="h-24" />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Show login prompt if not authenticated */}
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              Welcome to Your Dashboard
            </h2>
            <p className="mb-6 max-w-md text-slate-500">
              Sign in to view your uploads, downloads, and notifications. Join
              our learning family today!
            </p>
            <Button
              onClick={() => setShowLoginModal(true)}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 text-white"
            >
              Sign In to Continue
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={user?.avatar || "/placeholder.svg"}
                  alt={user?.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xl text-white">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {user?.name}
                </h1>
                <p className="text-slate-500">{user?.email}</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 grid h-auto w-full grid-cols-4 gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="uploads"
                  className="gap-2 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-900 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:!text-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">My Uploads</span>
                </TabsTrigger>
                <TabsTrigger
                  value="downloads"
                  className="gap-2 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-900 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:!text-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Downloads</span>
                </TabsTrigger>
                <TabsTrigger
                  value="liked"
                  className="gap-2 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-900 data-[state=active]:border-rose-400 data-[state=active]:bg-rose-50 data-[state=active]:!text-rose-700"
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Liked</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="relative gap-2 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-900 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:!text-blue-700"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                  {notificationsList.some((n) => !n.read) && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="gap-2 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-900 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:!text-blue-700"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
              </TabsList>

              {/* My Uploads */}
              <TabsContent value="uploads" className="space-y-4">
                {userUploads.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userUploads.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                              <FileText className="h-6 w-6 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 
                                className="font-semibold text-slate-900 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => handleOpenDocument(doc.id)}
                              >
                                {doc.title}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {doc.type === "short_note"
                                  ? "Short Notes"
                                  : doc.type === "paper"
                                    ? "Paper"
                                    : "Book"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mb-4 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <Download className="mx-auto mb-1 h-4 w-4 text-slate-500" />
                            <p className="font-semibold text-slate-800">
                              {doc.downloads}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <Eye className="mx-auto mb-1 h-4 w-4 text-slate-500" />
                            <p className="font-semibold text-slate-800">
                              {doc.views}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <Heart className="mx-auto mb-1 h-4 w-4 text-slate-500" />
                            <p className="font-semibold text-slate-800">
                              {doc.upvotes}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900 border-slate-300"
                            onClick={() => handleShare(doc.id)}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-lg bg-white text-rose-500 hover:text-rose-600 border-slate-300"
                            onClick={() => handleDeleteClick(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                      <Upload className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-slate-900">
                      No uploads yet
                    </h3>
                    <p className="mb-4 text-slate-500">
                      Start sharing your notes to help other students
                    </p>
                    <Link href="/upload">
                      <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        Upload Now
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* My Downloads */}
              <TabsContent value="downloads" className="space-y-4">
                {userDownloads.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userDownloads.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                            <FileText className="h-6 w-6 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 
                              className="font-semibold text-slate-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleOpenDocument(doc.id)}
                            >
                              {doc.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              by {doc.uploader_name || "Anonymous"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900"
                            onClick={() => handleShare(doc.id)}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                      <Download className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-slate-900">
                      No downloads yet
                    </h3>
                    <p className="mb-4 text-slate-500">
                      Browse and download study materials to see them here
                    </p>
                    <Link href="/browse">
                      <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        Browse Documents
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">
                    Notifications
                  </h2>
                  {notificationsList.some((n) => !n.read) && notificationsView === "unread" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>

                {/* Unread/Read Toggle */}
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                  <button
                    onClick={() => setNotificationsView("unread")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      notificationsView === "unread"
                        ? "bg-blue-500 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Bell className="h-4 w-4" />
                    Unread
                    {notificationsList.filter(n => !n.read).length > 0 && (
                      <span className={cn(
                        "ml-1 rounded-full px-2 py-0.5 text-xs",
                        notificationsView === "unread" 
                          ? "bg-white/20 text-white" 
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {notificationsList.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setNotificationsView("read")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      notificationsView === "read"
                        ? "bg-blue-500 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Check className="h-4 w-4" />
                    Read
                  </button>
                </div>

                {/* Notifications List */}
                {(() => {
                  const filteredNotifications = notificationsList.filter(n => 
                    notificationsView === "unread" ? !n.read : n.read
                  );

                  return filteredNotifications.length > 0 ? (
                    <div className="space-y-2">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-colors",
                            notification.type === "thank_you"
                              ? "border-green-200 bg-green-50/50"
                              : !notification.read
                              ? "border-blue-200 bg-blue-50/50"
                              : "border-slate-200 bg-white",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              notification.type === "comment" &&
                                "bg-blue-100 text-blue-600",
                              notification.type === "download" &&
                                "bg-emerald-100 text-emerald-600",
                              notification.type === "system" &&
                                "bg-slate-100 text-slate-600",
                              notification.type === "thank_you" &&
                                "bg-green-100 text-green-600",
                            )}
                          >
                            {notification.type === "comment" && (
                              <MessageSquare className="h-5 w-5" />
                            )}
                            {notification.type === "download" && (
                              <Download className="h-5 w-5" />
                            )}
                            {notification.type === "system" && (
                              <Bell className="h-5 w-5" />
                            )}
                            {notification.type === "thank_you" && (
                              <Heart className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {notification.type === "thank_you" ? (
                              <>
                                <p className="font-medium text-green-700">
                                  {(notification as any).title || notification.message.split('\\n')[0]}
                                </p>
                                <p className="mt-1 text-sm text-slate-700 italic">
                                  "{(notification as any).fullMessage || notification.message.split('\\n')[1] || notification.message}"
                                </p>
                              </>
                            ) : (
                              <p className="text-slate-700">
                                {notification.message}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                              {notification.timestamp}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              className="shrink-0 bg-blue-300 text-blue-900 hover:bg-blue-200 hover:text-blue-700"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                        <Bell className="h-7 w-7 text-slate-400" />
                      </div>
                      <h3 className="mb-2 font-semibold text-slate-900">
                        {notificationsView === "unread" ? "No unread notifications" : "No read notifications"}
                      </h3>
                      <p className="text-slate-500">
                        {notificationsView === "unread" ? "You're all caught up!" : "Read notifications will appear here"}
                      </p>
                    </div>
                  );
                })()}
              </TabsContent>

              {/* Liked Documents */}
              <TabsContent value="liked" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Liked Documents</h2>
                </div>

                {/* Document Grid */}
                {userLiked.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userLiked.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedDocument(doc.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                            <FileText className="h-6 w-6 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 line-clamp-2">
                              {doc.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              by {doc.uploader_name || "Anonymous"}
                            </p>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                            <Heart className="h-4 w-4 text-rose-600 fill-rose-500" />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {doc.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3.5 w-3.5" />
                            {doc.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {doc.upvotes}
                          </span>
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const result = await fetch(`/api/documents/${doc.id}/download`, { method: "POST" });
                                const data = await result.json();
                                if (data.success && data.data?.url) {
                                  window.open(data.data.url, '_blank');
                                  toast.success("Download started!");
                                } else {
                                  toast.error("Failed to download");
                                }
                              } catch {
                                toast.error("Failed to download");
                              }
                            }}
                            className="w-full gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                            size="sm"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100">
                      <Heart className="h-7 w-7 text-rose-500" />
                    </div>
                    <h3 className="mb-2 font-semibold text-slate-900">
                      No liked documents yet
                    </h3>
                    <p className="mb-4 text-slate-500">
                      Like documents to show appreciation to uploaders
                    </p>
                    <Link href="/browse">
                      <Button className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white">
                        Browse Documents
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* Account Settings */}
              <TabsContent value="account" className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 font-semibold text-slate-900">
                    Account Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Email</label>
                      <p className="mt-1 font-medium text-slate-900">
                        {user?.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">
                        Signed in with
                      </label>
                      <p className="mt-1 font-medium text-slate-900">Google</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
                  <h2 className="mb-2 font-semibold text-rose-700">
                    Danger Zone
                  </h2>
                  <p className="mb-4 text-sm text-rose-600/80">
                    Once you delete your account, there is no going back. Your
                    uploads will remain as Anonymous.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="rounded-xl bg-rose-500 border border-rose-700 text-white hover:bg-rose-600">
                      Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Your account will be
                          permanently deleted, but your uploads will remain as
                          Anonymous to continue helping other students.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your document.
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-900">
                  Type <span className="font-mono font-bold">delete</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type 'delete' to confirm"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmText("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== "delete"}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoginModal />
    </div>
  );
}

function DashboardWithSuspense() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardContent />
    </Suspense>
  );
}

export default function DashboardPage() {
  return (
    <AppProvider>
      <ToastProvider />
      <DashboardWithSuspense />
    </AppProvider>
  );
}
