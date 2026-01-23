"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { DocumentWithUploader } from "@/types";
import { ToastProvider } from "@/components/toast-provider";
import { toast } from "sonner";

import {
  AdminSidebar,
  OverviewSection,
  PendingReviewSection,
  PendingImagesSection,
  DocumentsSection,
  UsersSection,
  DownvotedSection,
  ComplementSection,
  ThankYouSection,
  SettingsSection,
  RecommendationsSection,
  type AdminStats,
  type AdminUser,
  type DownvotedDocument,
  type NavItem,
} from "./_components";
import type { PendingImageBatch } from "./_components/pending-images-section";

// Navigation items configuration
const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: "LayoutDashboard" },
  { id: "pending", label: "Pending Review", icon: "Clock", badgeKey: "pending" },
  { id: "pending-images", label: "Pending Images", icon: "Image", badgeKey: "pendingImages" },
  { id: "documents", label: "All Documents", icon: "FileText" },
  { id: "users", label: "All Users", icon: "Users" },
  { id: "downvoted", label: "Downvoted", icon: "ThumbsDown", badgeKey: "downvoted" },
  { id: "thank-you", label: "Thank You Messages", icon: "MessageSquare", badgeKey: "thankYou" },
  { id: "recommendations", label: "Recommendations", icon: "Lightbulb", badgeKey: "recommendations" },
  { id: "complement", label: "Send Complement", icon: "Heart" },
  { id: "settings", label: "Settings", icon: "Settings" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section") || "overview";
  const [activeSection, setActiveSection] = useState(sectionParam);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync section with URL
  useEffect(() => {
    setActiveSection(sectionParam);
  }, [sectionParam]);

  // Handle section change with URL update
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Admin access state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API state
  const [apiDocuments, setApiDocuments] = useState<DocumentWithUploader[]>([]);
  const [apiPending, setApiPending] = useState<DocumentWithUploader[]>([]);
  const [apiDownvoted, setApiDownvoted] = useState<DownvotedDocument[]>([]);
  const [apiUsers, setApiUsers] = useState<AdminUser[]>([]);
  const [apiStats, setApiStats] = useState<AdminStats | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImageBatch[]>([]);
  const [thankYouPending, setThankYouPending] = useState<number>(0);
  const [recommendationsPending, setRecommendationsPending] = useState<number>(0);

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

        // Fetch thank-you messages count
        const thankYouRes = await fetch("/api/admin/thank-you-messages?status=pending_review&limit=1");
        if (thankYouRes.ok) {
          const thankYouData = await thankYouRes.json();
          if (thankYouData.success) {
            setThankYouPending(thankYouData.data.total || 0);
          }
        }

        // Fetch recommendations count
        const recommendationsRes = await fetch("/api/admin/recommendations?status=pending&limit=1");
        if (recommendationsRes.ok) {
          const recommendationsData = await recommendationsRes.json();
          if (recommendationsData.success) {
            setRecommendationsPending(recommendationsData.data.total || 0);
          }
        }

        // Fetch pending images
        const pendingImagesRes = await fetch("/api/admin/pending-images");
        if (pendingImagesRes.ok) {
          const pendingImagesData = await pendingImagesRes.json();
          if (pendingImagesData.success) {
            setPendingImages(pendingImagesData.data || []);
          }
        }

        const [pendingRes, downvotedRes, usersRes, documentsRes] =
          await Promise.all([
            api.admin.pending(),
            api.admin.downvoted(),
            api.admin.users({}),
            api.documents.list({}), // Fetch all documents without limit
          ]);

        if (pendingRes.success && pendingRes.data) {
          setApiPending(pendingRes.data);
        }
        if (downvotedRes.success && downvotedRes.data) {
          setApiDownvoted(downvotedRes.data);
        }
        if (usersRes.success && usersRes.data) {
          setApiUsers(usersRes.data.users || []);
        }
        // Extract items from paginated response
        if (documentsRes.success && documentsRes.data) {
          const documents = documentsRes.data.items || documentsRes.data || [];
          setApiDocuments(Array.isArray(documents) ? documents : []);
        } else {
          console.error("Documents fetch failed:", documentsRes);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // Handler functions
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

  const handleDeleteDocument = async (id: string, title?: string) => {
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

  const handleViewDocument = (id: string) => {
    window.open(`/browse?doc=${id}`, "_blank");
  };

  const handleDownloadImages = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/pending-images/${id}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to download images");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pending-images-${id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Images downloaded successfully");
    } catch (error) {
      console.error("Error downloading images:", error);
      toast.error("Failed to download images");
    }
  };

  const handleDeleteImages = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/pending-images/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Image batch deleted successfully");
        setPendingImages((prev) => prev.filter((batch) => batch.id !== id));
      } else {
        toast.error(result.error || "Failed to delete image batch");
      }
    } catch (error) {
      console.error("Error deleting images:", error);
      toast.error("Failed to delete image batch");
    }
  };

  const handleMarkProcessed = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/pending-images/${id}/process`, {
        method: "POST",
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Batch marked as processed and images deleted");
        setPendingImages((prev) => prev.filter((batch) => batch.id !== id));
      } else {
        toast.error(result.error || "Failed to process batch");
      }
    } catch (error) {
      console.error("Error processing batch:", error);
      toast.error("Failed to process batch");
    }
  };

  const handleUploadCompiled = async (id: string, formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/pending-images/${id}/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Document published successfully! The user has been notified.");
        setPendingImages((prev) => prev.filter((batch) => batch.id !== id));
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading compiled document:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleRefreshPendingImages = async () => {
    try {
      const response = await fetch("/api/admin/pending-images");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPendingImages(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error refreshing pending images:", error);
    }
  };

  // Handler for sending compliments to users
  const handleSendComplement = async (
    userId: string, 
    documentId: string, 
    message: string,
    happinessLevel: "helpful" | "very_helpful" | "life_saver" = "very_helpful"
  ) => {
    try {
      const result = await api.admin.complement({
        documentId,
        userId,
        senderDisplayName: "Admin",
        happinessLevel,
        message,
      });

      if (result.success) {
        toast.success("Compliment sent successfully!");
      } else {
        toast.error(result.error || "Failed to send compliment");
      }
    } catch (error) {
      toast.error("Failed to send compliment");
    }
  };

  const handleResetVotes = async (documentId: string) => {
    // TODO: Implement vote reset API
    toast.info("Vote reset feature coming soon");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not admin state
  if (isAdmin === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
            <ShieldAlert className="h-10 w-10 text-rose-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-slate-600">
            You don't have permission to access the admin dashboard.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Prepare badge counts for sidebar
  const badgeCounts = {
    pending: apiPending.length,
    pendingImages: pendingImages.length,
    downvoted: apiDownvoted.length,
    thankYou: thankYouPending,
    recommendations: recommendationsPending,
  };

  // Render section content
  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <OverviewSection
            stats={apiStats}
            pending={apiPending}
            downvoted={apiDownvoted}
            onNavigate={setActiveSection}
          />
        );
      case "pending":
        return (
          <PendingReviewSection
            pending={apiPending}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      case "pending-images":
        return (
          <PendingImagesSection
            batches={pendingImages}
            onDownload={handleDownloadImages}
            onDelete={handleDeleteImages}
            onUploadCompiled={handleUploadCompiled}
            onRefresh={handleRefreshPendingImages}
          />
        );
      case "documents":
        return (
          <DocumentsSection
            documents={apiDocuments}
            onDeleteDocument={handleDeleteDocument}
          />
        );
      case "users":
        return <UsersSection users={apiUsers} />;
      case "downvoted":
        return (
          <DownvotedSection
            documents={apiDownvoted}
            onResetVotes={handleResetVotes}
            onRemove={handleDeleteDocument}
            onView={handleViewDocument}
          />
        );
      case "thank-you":
        return <ThankYouSection />;
      case "recommendations":
        return <RecommendationsSection />;
      case "settings":
        return <SettingsSection />;
      case "complement":
        return (
          <ComplementSection
            users={apiUsers}
            documents={apiDocuments as any}
            onSendComplement={handleSendComplement}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ToastProvider />
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <AdminSidebar
          navItems={navItems}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          badgeCounts={badgeCounts}
        />

        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          <div className="p-8">{renderSection()}</div>
        </main>
      </div>
    </>
  );
}
