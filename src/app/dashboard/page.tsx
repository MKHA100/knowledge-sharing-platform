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
  Bookmark,
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
  type: "comment" | "download" | "system";
  message: string;
  timestamp: string;
  read: boolean;
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
  } = useApp();
  const [activeTab, setActiveTab] = useState(tabParam || "uploads");
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    [],
  );
  const [userUploads, setUserUploads] = useState<DocumentWithUploader[]>([]);
  const [userDownloads, setUserDownloads] = useState<DocumentWithUploader[]>(
    [],
  );
  const [userSaved, setUserSaved] = useState<DocumentWithUploader[]>([]);
  const [userLiked, setUserLiked] = useState<DocumentWithUploader[]>([]);
  const [savedLikedView, setSavedLikedView] = useState<"saved" | "liked">("saved");
  const [loading, setLoading] = useState(true);

  // Fetch user data from API only if logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [uploadsRes, downloadsRes, notificationsRes, savedRes, likedRes] = await Promise.all([
          api.user.uploads(),
          api.user.downloads(),
          api.notifications.list(),
          api.user.saved(),
          api.user.liked(),
        ]);
        if (uploadsRes.success) setUserUploads(uploadsRes.data || []);
        if (downloadsRes.success) setUserDownloads(downloadsRes.data || []);
        if (savedRes.success) setUserSaved(savedRes.data || []);
        if (likedRes.success) setUserLiked(likedRes.data || []);
        if (notificationsRes.success) {
          const formatted = (notificationsRes.data || []).map(
            (n: {
              id: string;
              type: string;
              message: string;
              created_at: string;
              read: boolean;
            }) => ({
              id: n.id,
              type: n.type as "comment" | "download" | "system",
              message: n.message,
              timestamp: new Date(n.created_at).toLocaleDateString(),
              read: n.read,
            }),
          );
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

  const markAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    const hasUnread = notificationsList.some((n) => n.id !== id && !n.read);
    setHasNewNotification(hasUnread);
  };

  const markAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    setHasNewNotification(false);
    toast.success("All notifications marked as read");
  };

  const handleDeleteAccount = () => {
    setUser(null);
    toast.success("Account deleted. Your uploads will remain as Anonymous.");
  };

  const handleShare = (title: string) => {
    navigator.clipboard.writeText(`${window.location.origin}?doc=${title}`);
    toast.success("Link copied to clipboard!");
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
                  className="gap-2 rounded-xl border border-slate-2005 gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="uploads"
                  className="gap-2 rounded-xl border border-slate-200 bg-white py-3 text-slate-600 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">My Uploads</span>
                </TabsTrigger>
                <TabsTrigger
                  value="downloads"
                  className="gap-2 rounded-xl border border-slate-200 bg-white py-3 text-slate-600 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Downloads</span>
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="gap-2 rounded-xl border border-slate-200 bg-white py-3 text-slate-600 data-[state=active]:border-teal-400 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700"
                >
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Saved
                  className="relative gap-2 rounded-xl border border-slate-200 bg-white py-3 text-slate-600 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                  {notificationsList.some((n) => !n.read) && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="gap-2 rounded-xl border border-slate-200 bg-white py-3 text-slate-600 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
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
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                              <FileText className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 line-clamp-1">
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
                        <div className="mb-4 grid grid-cols-4 gap-2">
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
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <MessageSquare className="mx-auto mb-1 h-4 w-4 text-slate-500" />
                            <p className="font-semibold text-slate-800">
                              {(doc as any).comment_count || 0}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900 border-slate-300"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Stats
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900 border-slate-300"
                            onClick={() => handleShare(doc.title)}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-lg bg-white text-rose-500 hover:text-rose-600 border-slate-300"
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
                            <h3 className="font-semibold text-slate-900 line-clamp-2">
                              {doc.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              by {doc.uploader_name || "Anonymous"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Downloaded{" "}
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleDateString()
                              : "recently"}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-lg bg-white"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Say Thanks
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
                  Saved/Liked */}
              <TabsContent value="saved" className="space-y-4">
                {/* Toggle between Saved and Liked */}
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">
                    {savedLikedView === "saved" ? "Saved Documents" : "Liked Documents"}
                  </h2>
                  <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    <button
                      onClick={() => setSavedLikedView("saved")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        savedLikedView === "saved"
                          ? "bg-teal-500 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      Saved
                    </button>
                    <button
                      onClick={() => setSavedLikedView("liked")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        savedLikedView === "liked"
                          ? "bg-rose-500 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Heart className="h-3.5 w-3.5" />
                      Liked
                    </button>
                  </div>
                </div>

                {/* Document Grid */}
                {(savedLikedView === "saved" ? userSaved : userLiked).length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(savedLikedView === "saved" ? userSaved : userLiked).map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            savedLikedView === "saved" ? "bg-amber-100" : "bg-rose-100"
                          )}>
                            {savedLikedView === "saved" ? (
                              <Bookmark className="h-4 w-4 text-amber-600 fill-amber-500" />
                            ) : (
                              <Heart className="h-4 w-4 text-rose-600 fill-rose-500" />
                            )}
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
                    <div className={cn(
                      "mb-4 flex h-14 w-14 items-center justify-center rounded-xl",
                      savedLikedView === "saved" ? "bg-amber-100" : "bg-rose-100"
                    )}>
                      {savedLikedView === "saved" ? (
                        <Bookmark className="h-7 w-7 text-amber-500" />
                      ) : (
                        <Heart className="h-7 w-7 text-rose-500" />
                      )}
                    </div>
                    <h3 className="mb-2 font-semibold text-slate-900">
                      No {savedLikedView} documents yet
                    </h3>
                    <p className="mb-4 text-slate-500">
                      {savedLikedView === "saved"
                        ? "Save documents to access them quickly later"
                        : "Like documents to show appreciation to uploaders"}
                    </p>
                    <Link href="/browse">
                      <Button className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                        Browse Documents
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* <h2 className="font-semibold text-slate-900">
                    Notifications
                  </h2>
                  {notificationsList.some((n) => !n.read) && (
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

                {notificationsList.length > 0 ? (
                  <div className="space-y-2">
                    {notificationsList.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm transition-colors",
                          !notification.read
                            ? "border-blue-200 bg-blue-50/50"
                            : "border-slate-200",
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
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-700">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {notification.timestamp}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            className="shrink-0 text-blue-600 hover:text-blue-700"
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
                      No notifications
                    </h3>
                    <p className="text-slate-500">You're all caught up!</p>
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
                      <Button variant="destructive" className="rounded-xl">
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
