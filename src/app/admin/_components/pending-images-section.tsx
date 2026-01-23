import { useState } from "react";
import { Download, Trash2, User, Calendar, Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SUBJECTS } from "@/lib/constants/subjects";

export interface PendingImageBatch {
  id: string;
  uploader_id: string;
  uploader_name: string;
  uploader_email: string;
  file_paths: string[];
  image_count: number;
  status: string;
  created_at: string;
  submission_notes?: string;
}

interface PendingImagesProps {
  batches: PendingImageBatch[];
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUploadCompiled: (id: string, formData: FormData) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function PendingImagesSection({
  batches,
  onDownload,
  onDelete,
  onUploadCompiled,
  onRefresh,
}: PendingImagesProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [actionBatchId, setActionBatchId] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<PendingImageBatch | null>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("paper");
  const [subject, setSubject] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [medium, setMedium] = useState<string>("english");

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      await onDownload(id);
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setActionBatchId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!actionBatchId) return;
    
    setDeleteDialogOpen(false);
    setDeleting(actionBatchId);
    try {
      await onDelete(actionBatchId);
    } finally {
      setDeleting(null);
      setActionBatchId(null);
    }
  };

  const handleUploadClick = (batch: PendingImageBatch) => {
    setSelectedBatch(batch);
    setActionBatchId(batch.id);
    // Pre-fill title with user name
    setTitle(`${batch.uploader_name}'s Document`);
    setDescription(batch.submission_notes || "Compiled from uploaded images");
    setUploadDialogOpen(true);
  };

  const handleUploadConfirm = async () => {
    if (!actionBatchId || !uploadFile || !subject || !title) {
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("type", documentType);
      formData.append("subject", subject);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("medium", medium);

      await onUploadCompiled(actionBatchId, formData);
      
      // Reset form
      setUploadFile(null);
      setDocumentType("paper");
      setSubject("");
      setTitle("");
      setDescription("");
      setMedium("english");
      setUploadDialogOpen(false);
      setSelectedBatch(null);
      setActionBatchId(null);
      
      // Refresh the list
      await onRefresh();
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pending Image Batches</h2>
            <p className="text-sm text-slate-500 mt-1">
              Review image submissions, compile to PDF, and publish as documents
            </p>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {batches.length} batch{batches.length !== 1 ? "es" : ""} pending
          </Badge>
        </div>

        {batches.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No Pending Images
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              All image submissions have been processed
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {batch.uploader_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {batch.uploader_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {batch.uploader_email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {batch.image_count} image{batch.image_count !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(batch.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-slate-500">
                        {batch.submission_notes || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(batch.id)}
                          disabled={downloading === batch.id}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {downloading === batch.id ? "Downloading..." : "Download"}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUploadClick(batch)}
                          disabled={uploading}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Upload className="h-4 w-4" />
                          Upload PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(batch.id)}
                          disabled={deleting === batch.id}
                          className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image Batch</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to delete this image batch? This will permanently
                remove all images from storage. This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete Batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Compiled PDF Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Compiled Document</DialogTitle>
            <DialogDescription>
              Upload the PDF compiled from {selectedBatch?.uploader_name}'s images.
              This will be published as if they uploaded it directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Uploader Info */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
                  {selectedBatch?.uploader_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    Uploading for: {selectedBatch?.uploader_name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {selectedBatch?.image_count} images submitted
                  </div>
                </div>
              </div>
              {selectedBatch?.submission_notes && (
                <div className="mt-3 text-sm text-slate-600">
                  <strong>User notes:</strong> {selectedBatch.submission_notes}
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="pdf-file">Compiled PDF Document *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {uploadFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setUploadFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadFile && (
                <p className="text-sm text-slate-500">
                  {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="short_note">Short Note</SelectItem>
                  <SelectItem value="paper">Paper</SelectItem>
                  <SelectItem value="jumbled">Jumbled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {SUBJECTS.map((subj) => (
                    <SelectItem key={subj.id} value={subj.id}>
                      {subj.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document"
                rows={3}
              />
            </div>

            {/* Medium */}
            <div className="space-y-2">
              <Label htmlFor="medium">Medium *</Label>
              <Select value={medium} onValueChange={setMedium}>
                <SelectTrigger id="medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sinhala">Sinhala</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="tamil">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadConfirm}
              disabled={uploading || !uploadFile || !subject || !title}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
