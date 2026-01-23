"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  AlertCircle,
  Sparkles,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ThankYouMessage {
  id: string;
  message: string;
  sentiment_category: "positive" | "neutral" | "negative" | "inappropriate";
  ai_confidence: number;
  ai_reasoning: string;
  status: "pending_review" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string;
  admin_edited_message?: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  document: {
    id: string;
    title: string;
    subject: string;
    type: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
}

interface ThankYouSectionProps {
  activeTab?: "pending" | "approved";
}

export function ThankYouSection({ activeTab = "pending" }: ThankYouSectionProps) {
  const [tab, setTab] = useState<"pending" | "approved">(activeTab);
  const [messages, setMessages] = useState<ThankYouMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [tab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const status = tab === "pending" ? "pending_review" : "approved";
      const response = await fetch(
        `/api/admin/thank-you-messages?status=${status}&limit=50`
      );
      const result = await response.json();

      if (result.success) {
        setMessages(result.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch thank you messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (messageId: string, isEdited: boolean = false) => {
    try {
      setActionLoading(messageId);
      const response = await fetch(
        `/api/admin/thank-you-messages/${messageId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            editedMessage: isEdited ? editedMessage : null,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to approve");

      toast.success(isEdited ? "Message edited and approved!" : "Message approved!");
      setEditingId(null);
      setEditedMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Failed to approve message:", error);
      toast.error("Failed to approve message");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (messageId: string) => {
    try {
      setActionLoading(messageId);
      const response = await fetch(
        `/api/admin/thank-you-messages/${messageId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject" }),
        }
      );

      if (!response.ok) throw new Error("Failed to reject");

      toast.success("Message rejected (sender not notified)");
      fetchMessages();
    } catch (error) {
      console.error("Failed to reject message:", error);
      toast.error("Failed to reject message");
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (message: ThankYouMessage) => {
    setEditingId(message.id);
    setEditedMessage(message.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedMessage("");
  };

  const getSentimentBadge = (
    category: string,
    confidence: number
  ): { color: string; icon: React.ReactElement; label: string } => {
    switch (category) {
      case "positive":
        return {
          color: "bg-green-100 text-green-700 border-green-200",
          icon: <CheckCircle className="h-3 w-3" />,
          label: `Positive (${Math.round(confidence * 100)}%)`,
        };
      case "neutral":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <Clock className="h-3 w-3" />,
          label: `Neutral (${Math.round(confidence * 100)}%)`,
        };
      case "negative":
        return {
          color: "bg-orange-100 text-orange-700 border-orange-200",
          icon: <AlertCircle className="h-3 w-3" />,
          label: `Negative (${Math.round(confidence * 100)}%)`,
        };
      case "inappropriate":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle className="h-3 w-3" />,
          label: `Inappropriate (${Math.round(confidence * 100)}%)`,
        };
      default:
        return {
          color: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <Clock className="h-3 w-3" />,
          label: "Unknown",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Thank You Messages
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("pending")}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
            tab === "pending"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          To Be Reviewed
          {messages.length > 0 && tab === "pending" && (
            <Badge className="ml-2 bg-teal-100 text-teal-700 hover:bg-teal-100">
              {messages.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setTab("approved")}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
            tab === "approved"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Approved
        </button>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {tab === "pending"
              ? "No messages pending review"
              : "No approved messages yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const sentiment = getSentimentBadge(
              msg.sentiment_category,
              msg.ai_confidence
            );
            const isEditing = editingId === msg.id;

            return (
              <div
                key={msg.id}
                className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow"
              >
                {/* Header: Sender → Recipient */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={msg.sender.avatar_url} />
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {msg.sender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {msg.sender.name}
                      </p>
                      <p className="text-xs text-slate-500">{msg.sender.email}</p>
                    </div>
                    <span className="text-slate-400">→</span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={msg.recipient.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {msg.recipient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {msg.recipient.name}
                      </p>
                      <p className="text-xs text-slate-500">{msg.recipient.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Document Info */}
                <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{msg.document.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {msg.document.subject}
                  </Badge>
                </div>

                {/* AI Analysis */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium text-slate-700">
                      AI Analysis
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      className={cn(
                        "flex items-center gap-1.5 border",
                        sentiment.color
                      )}
                    >
                      {sentiment.icon}
                      {sentiment.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "{msg.ai_reasoning}"
                  </p>
                </div>

                {/* Message */}
                {isEditing ? (
                  <div className="mb-4">
                    <Textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      className="min-h-[80px] text-sm"
                      placeholder="Edit the message..."
                    />
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-900 leading-relaxed">
                      "{msg.admin_edited_message || msg.message}"
                    </p>
                    {msg.admin_edited_message && (
                      <p className="text-xs text-slate-400 mt-2 italic">
                        Edited by admin
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {tab === "pending" && (
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={() => handleApprove(msg.id, true)}
                          disabled={!editedMessage.trim() || actionLoading === msg.id}
                          className="bg-teal-500 hover:bg-teal-600 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Approve Edited
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === msg.id}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleApprove(msg.id)}
                          disabled={actionLoading === msg.id}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => startEdit(msg)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === msg.id}
                        >
                          <Edit2 className="h-4 w-4 mr-1.5" />
                          Edit & Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(msg.id)}
                          disabled={actionLoading === msg.id}
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Reject (Silent)
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {tab === "approved" && msg.reviewed_at && msg.reviewer && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    <span>
                      Approved by {msg.reviewer.name} on{" "}
                      {new Date(msg.reviewed_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
