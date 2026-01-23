"use client";

import { useState } from "react";
import { Search, Eye, X, ArrowUpDown, Trash2, FileText, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DocumentWithUploader } from "@/types";
import { getSubjectDisplayName, SUBJECTS } from "@/lib/constants/subjects";
import { cn } from "@/lib/utils";

interface DocumentsSectionProps {
  documents: DocumentWithUploader[];
  onDeleteDocument: (id: string, title: string) => Promise<void>;
}

export function DocumentsSection({
  documents,
  onDeleteDocument,
}: DocumentsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [documentSort, setDocumentSort] = useState("newest");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectComboOpen, setSubjectComboOpen] = useState(false);

  // Filter and sort documents
  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch = doc.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        (doc.uploader_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = documentFilter === "all" || doc.subject === documentFilter;
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (documentSort) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            All Documents
          </h1>
          <p className="text-slate-500">
            Browse and manage all uploaded documents ({documents.length} total)
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
            <Popover open={subjectComboOpen} onOpenChange={setSubjectComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={subjectComboOpen}
                  className="h-9 w-[200px] justify-between rounded-lg border-slate-200 bg-white text-sm shadow-sm transition-colors hover:border-blue-300"
                >
                  {documentFilter === "all"
                    ? "All Subjects"
                    : getSubjectDisplayName(documentFilter)}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl">
                <Command>
                  <CommandInput placeholder="Search subjects..." />
                  <CommandList>
                    <CommandEmpty>No subject found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={(currentValue) => {
                          setDocumentFilter(currentValue);
                          setSubjectComboOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            documentFilter === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Subjects
                      </CommandItem>
                      {SUBJECTS.map((subject) => (
                        <CommandItem
                          key={subject.id}
                          value={subject.id}
                          keywords={[subject.displayName, ...subject.searchTerms]}
                          onSelect={(currentValue) => {
                            setDocumentFilter(currentValue);
                            setSubjectComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              documentFilter === subject.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {subject.displayName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-200 bg-white text-sm shadow-sm transition-colors hover:border-blue-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right: Sort */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort</span>
            </div>
            <Select value={documentSort} onValueChange={setDocumentSort}>
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-slate-200 bg-white text-sm shadow-sm transition-colors hover:border-blue-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="downloads">Most Downloads</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="upvotes">Most Upvotes</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
          <FileText className="mb-4 h-12 w-12 text-slate-300" />
          <h2 className="mb-2 text-xl font-semibold text-slate-900">No documents found</h2>
          <p className="text-slate-500">
            {searchQuery ? "Try adjusting your search or filters." : "Documents will appear here once uploaded."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                  Subject
                </TableHead>
                <TableHead className="font-semibold text-slate-900">
                  Status
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
                <TableHead className="w-24 font-semibold text-slate-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-slate-50">
                  <TableCell className="max-w-xs font-medium text-slate-900">
                    <div className="truncate" title={doc.title}>
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {doc.uploader_name || "Anonymous"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {(doc.subject && getSubjectDisplayName(doc.subject)) || doc.subject || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        doc.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : doc.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }
                    >
                      {doc.status}
                    </Badge>
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
                        className="h-8 w-8 rounded-lg"
                        onClick={() => window.open(`/browse?doc=${doc.id}`, "_blank")}
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{doc.title}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-lg bg-rose-500 hover:bg-rose-600"
                              onClick={() => onDeleteDocument(doc.id, doc.title)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results count */}
      {filteredDocuments.length > 0 && (
        <div className="text-sm text-slate-500">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      )}
    </div>
  );
}
