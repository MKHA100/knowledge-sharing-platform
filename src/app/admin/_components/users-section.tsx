"use client";

import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Heart,
  MessageSquare,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { AdminUser, UserActivity } from "./types";

// Mock user activity data - in production, this would come from API
const mockUserActivities: Record<string, UserActivity[]> = {
  // Empty for now - will be populated by API
};

interface UsersSectionProps {
  users: AdminUser[];
}

export function UsersSection({ users }: UsersSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState("all");

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  const userActivitiesData = selectedUserId
    ? mockUserActivities[selectedUserId] || []
    : [];

  const filteredActivities =
    activityFilter === "all"
      ? userActivitiesData
      : userActivitiesData.filter((activity) => activity.type === activityFilter);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
        return <Upload className="h-4 w-4 text-blue-500" />;
      case "download":
        return <Download className="h-4 w-4 text-emerald-500" />;
      case "like":
        return <Heart className="h-4 w-4 text-rose-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-violet-500" />;
      default:
        return null;
    }
  };

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
              {selectedUser ? `${selectedUser.name}'s Activity` : "All Users"}
            </h1>
            <p className="text-slate-500">
              {selectedUser
                ? "View complete user activity log"
                : `Manage users and view their activity (${users.length} users)`}
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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-900">User</TableHead>
                <TableHead className="font-semibold text-slate-900">Email</TableHead>
                <TableHead className="text-right font-semibold text-slate-900">Uploads</TableHead>
                <TableHead className="text-right font-semibold text-slate-900">Downloads</TableHead>
                <TableHead className="font-semibold text-slate-900">Joined</TableHead>
                <TableHead className="font-semibold text-slate-900">Last Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url || user.avatar || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
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
                    <ChevronRight className="h-4 w-4 text-slate-400" />
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
                <AvatarImage src={selectedUser.avatar_url || selectedUser.avatar || undefined} />
                <AvatarFallback className="bg-blue-100 text-xl text-blue-700">
                  {selectedUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{selectedUser.name}</h2>
                <p className="text-slate-500">{selectedUser.email}</p>
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
                  <p className="text-sm text-slate-500">Downloads</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Filter */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Filter Activity</span>
            </div>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-900">Activity Type</TableHead>
                  <TableHead className="font-semibold text-slate-900">Document</TableHead>
                  <TableHead className="font-semibold text-slate-900">Details</TableHead>
                  <TableHead className="font-semibold text-slate-900">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <span className="capitalize text-slate-900">{activity.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{activity.document}</TableCell>
                      <TableCell className="text-slate-600">{activity.details || "-"}</TableCell>
                      <TableCell className="text-slate-600">{activity.timestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <p className="text-slate-500">No activity found for this filter.</p>
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
}
