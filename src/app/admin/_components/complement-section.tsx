"use client";

import { useState } from "react";
import { Check, Sparkles, Send, ChevronRight, Smile, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminUser, Document } from "./types";

// Happiness level type matching the database enum
type HappinessLevel = "helpful" | "very_helpful" | "life_saver";

interface ComplementSectionProps {
  users: AdminUser[];
  documents: Document[];
  onSendComplement?: (userId: string, documentId: string, message: string, happinessLevel: HappinessLevel) => Promise<void>;
}

export function ComplementSection({
  users,
  documents,
  onSendComplement,
}: ComplementSectionProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [complementMessage, setComplementMessage] = useState("");
  const [happinessLevel, setHappinessLevel] = useState<HappinessLevel>("very_helpful");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Get documents by selected user
  const userDocuments = selectedUser
    ? documents.filter((d) => d.uploader_id === selectedUser.id)
    : [];

  const handleSendComplement = async () => {
    if (!selectedUser || !selectedDocument || !complementMessage.trim()) return;

    setSending(true);
    try {
      if (onSendComplement) {
        await onSendComplement(selectedUser.id, selectedDocument.id, complementMessage, happinessLevel);
      }
      setSent(true);
    } catch (error) {
      console.error("Failed to send complement:", error);
    } finally {
      setSending(false);
    }
  };

  const resetFlow = () => {
    setSelectedUser(null);
    setSelectedDocument(null);
    setComplementMessage("");
    setHappinessLevel("very_helpful");
    setSent(false);
  };

  // Happiness level options with labels and icons
  const happinessOptions: { value: HappinessLevel; label: string; emoji: string; description: string }[] = [
    { value: "helpful", label: "Helpful", emoji: "😊", description: "Good contribution" },
    { value: "very_helpful", label: "Very Helpful", emoji: "😃", description: "Great work!" },
    { value: "life_saver", label: "Life Saver", emoji: "🤩", description: "Outstanding!" },
  ];

  // Success state
  if (sent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Send Compliment</h1>
          <p className="text-slate-500">Recognize outstanding contributions</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-emerald-900">Compliment Sent!</h3>
          <p className="mt-2 text-emerald-700">
            {selectedUser?.name} has been notified about their outstanding work on "
            {selectedDocument?.title}".
          </p>
          <Button onClick={resetFlow} className="mt-6 gap-2 rounded-xl">
            <Sparkles className="h-4 w-4" />
            Send Another Compliment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Send Compliment</h1>
        <p className="text-slate-500">Recognize outstanding contributions from users</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            selectedUser
              ? "bg-emerald-100 text-emerald-700"
              : "bg-blue-600 text-white"
          }`}
        >
          {selectedUser ? <Check className="h-4 w-4" /> : "1"}
        </div>
        <span
          className={`text-sm font-medium ${
            selectedUser ? "text-slate-500" : "text-slate-900"
          }`}
        >
          Select User
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            selectedDocument
              ? "bg-emerald-100 text-emerald-700"
              : selectedUser
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-500"
          }`}
        >
          {selectedDocument ? <Check className="h-4 w-4" /> : "2"}
        </div>
        <span
          className={`text-sm font-medium ${
            selectedDocument
              ? "text-slate-500"
              : selectedUser
                ? "text-slate-900"
                : "text-slate-400"
          }`}
        >
          Select Document
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            selectedDocument
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          3
        </div>
        <span
          className={`text-sm font-medium ${
            selectedDocument ? "text-slate-900" : "text-slate-400"
          }`}
        >
          Write Message
        </span>
      </div>

      {/* Step 1: Select User */}
      {!selectedUser && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Select a User</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || user.avatar || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-sm text-slate-500 truncate">{user.email}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {user.upload_count || 0} uploads
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Document */}
      {selectedUser && !selectedDocument && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Select a Document from {selectedUser.name}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUser(null)}
              className="rounded-lg"
            >
              Change User
            </Button>
          </div>

          {userDocuments.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-500">
                This user hasn't uploaded any documents yet.
              </p>
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="mt-4 rounded-lg"
              >
                Select Another User
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {userDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
                >
                  <h3 className="font-medium text-slate-900 line-clamp-2">{doc.title}</h3>
                  <p className="text-sm text-slate-500">{doc.subject}</p>
                  <div className="mt-auto flex items-center gap-3 text-xs text-slate-400">
                    <span>{doc.views || 0} views</span>
                    <span>{doc.downloads || 0} downloads</span>
                    <span>{doc.upvotes || 0} upvotes</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Write Message */}
      {selectedUser && selectedDocument && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Write Your Compliment</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDocument(null)}
              className="rounded-lg"
            >
              Change Document
            </Button>
          </div>

          {/* Preview Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.avatar_url || selectedUser.avatar || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {selectedUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-900">{selectedUser.name}</p>
                <p className="text-sm text-slate-500">
                  For: {selectedDocument.title}
                </p>
              </div>
            </div>
          </div>

          {/* Happiness Level Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">How impactful was this contribution?</p>
            <div className="grid grid-cols-3 gap-3">
              {happinessOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHappinessLevel(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                    happinessLevel === option.value
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    happinessLevel === option.value ? "text-blue-700" : "text-slate-700"
                  )}>
                    {option.label}
                  </span>
                  <span className="text-xs text-slate-500">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <Textarea
            placeholder="Write a personalized compliment message..."
            value={complementMessage}
            onChange={(e) => setComplementMessage(e.target.value)}
            className="min-h-[120px] resize-none rounded-xl"
          />

          {/* Quick Templates */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Quick templates:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Outstanding work on this document! Your contribution is greatly appreciated.",
                "This is exactly the kind of quality content we love to see. Thank you!",
                "Your detailed work helps many students. Keep up the excellent work!",
              ].map((template, i) => (
                <button
                  key={i}
                  onClick={() => setComplementMessage(template)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  Template {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendComplement}
            disabled={!complementMessage.trim() || sending}
            className="w-full gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-medium hover:from-blue-700 hover:to-indigo-700"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Compliment
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
