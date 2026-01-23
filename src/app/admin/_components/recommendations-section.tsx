"use client";

import { useState, useEffect } from "react";
import { 
  Lightbulb, 
  User, 
  Calendar, 
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Loader2,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "pending" | "reviewed" | "implemented" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    name: string;
  };
}

type FilterStatus = "all" | "pending" | "reviewed" | "implemented" | "rejected";

export function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [filterStatus]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/recommendations?status=${filterStatus === "all" ? "" : filterStatus}&limit=100`
      );
      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.items || []);
      } else {
        toast.error(result.error || "Failed to load recommendations");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Recommendation["status"], notes?: string) => {
    try {
      setActionLoading(id);
      const response = await fetch(`/api/admin/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: notes }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Recommendation marked as ${status}`);
        fetchRecommendations();
        setShowDetailDialog(false);
      } else {
        toast.error(result.error || "Failed to update recommendation");
      }
    } catch (error) {
      console.error("Error updating recommendation:", error);
      toast.error("Failed to update recommendation");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteRecommendation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recommendation?")) return;

    try {
      setActionLoading(id);
      const response = await fetch(`/api/admin/recommendations/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Recommendation deleted");
        setRecommendations(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(result.error || "Failed to delete recommendation");
      }
    } catch (error) {
      console.error("Error deleting recommendation:", error);
      toast.error("Failed to delete recommendation");
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = (rec: Recommendation) => {
    setSelectedRec(rec);
    setAdminNotes(rec.admin_notes || "");
    setShowDetailDialog(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: Recommendation["status"]) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700",
      reviewed: "bg-blue-100 text-blue-700",
      implemented: "bg-emerald-100 text-emerald-700",
      rejected: "bg-rose-100 text-rose-700",
    };
    return (
      <Badge className={cn("capitalize", styles[status])}>
        {status}
      </Badge>
    );
  };

  const pendingCount = recommendations.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            User Recommendations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Feature requests and feedback from users
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        {(["all", "pending", "reviewed", "implemented", "rejected"] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              filterStatus === status
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Lightbulb className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            No Recommendations
          </h3>
          <p className="text-slate-500">
            {filterStatus === "all" 
              ? "No user recommendations yet" 
              : `No ${filterStatus} recommendations`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{rec.name}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {rec.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-md truncate text-sm text-slate-700">
                      {rec.message}
                    </p>
                  </TableCell>
                  <TableCell>{getStatusBadge(rec.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(rec.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(rec)}
                        className="gap-1.5"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {rec.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(rec.id, "reviewed")}
                            disabled={actionLoading === rec.id}
                            className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Reviewed
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRecommendation(rec.id)}
                        disabled={actionLoading === rec.id}
                        className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Recommendation Details
            </DialogTitle>
            <DialogDescription>
              Review and respond to user feedback
            </DialogDescription>
          </DialogHeader>

          {selectedRec && (
            <div className="space-y-4">
              {/* Sender Info */}
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{selectedRec.name}</div>
                  <div className="text-sm text-slate-500">{selectedRec.email}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-slate-500">Submitted</div>
                  <div className="text-sm font-medium text-slate-700">
                    {formatDate(selectedRec.created_at)}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  User Message
                </label>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
                  {selectedRec.message}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Status:</span>
                {getStatusBadge(selectedRec.status)}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Admin Notes (optional)
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any internal notes about this recommendation..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {selectedRec?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => updateStatus(selectedRec.id, "rejected", adminNotes)}
                  disabled={actionLoading === selectedRec.id}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatus(selectedRec.id, "reviewed", adminNotes)}
                  disabled={actionLoading === selectedRec.id}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Mark as Reviewed
                </Button>
                <Button
                  onClick={() => updateStatus(selectedRec.id, "implemented", adminNotes)}
                  disabled={actionLoading === selectedRec.id}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Implemented
                </Button>
              </>
            )}
            {selectedRec?.status !== "pending" && (
              <Button
                onClick={() => {
                  if (selectedRec) {
                    updateStatus(selectedRec.id, selectedRec.status, adminNotes);
                  }
                }}
                disabled={actionLoading === selectedRec?.id}
              >
                Save Notes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
