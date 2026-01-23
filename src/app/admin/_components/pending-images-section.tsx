import { useState } from "react";
import { Download, Trash2, User, Calendar, Image as ImageIcon, CheckCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export interface PendingImageBatch {
  id: string;
  uploader_id: string;
  uploader_name: string;
  uploader_email: string;
  file_paths: string[];
  image_count: number;
  status: string;
  created_at: string;
}

interface PendingImagesProps {
  batches: PendingImageBatch[];
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkProcessed: (id: string) => Promise<void>;
}

export function PendingImagesSection({
  batches,
  onDownload,
  onDelete,
  onMarkProcessed,
}: PendingImagesProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [actionBatchId, setActionBatchId] = useState<string | null>(null);

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

  const handleMarkProcessedClick = (id: string) => {
    setActionBatchId(id);
    setProcessDialogOpen(true);
  };

  const handleMarkProcessedConfirm = async () => {
    if (!actionBatchId) return;
    
    setProcessDialogOpen(false);
    setProcessing(actionBatchId);
    try {
      await onMarkProcessed(actionBatchId);
    } finally {
      setProcessing(null);
      setActionBatchId(null);
    }
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

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <ImageIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          No Pending Images
        </h3>
        <p className="text-slate-500">
          Image submissions from users will appear here for review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Pending Image Submissions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review and download image batches uploaded by users
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {batches.length} {batches.length === 1 ? "batch" : "batches"}
        </Badge>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Uploader</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {batch.uploader_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {batch.uploader_email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {batch.image_count} {batch.image_count === 1 ? "image" : "images"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    {formatDate(batch.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(batch.id)}
                      disabled={downloading === batch.id || processing === batch.id}
                      className="gap-1.5"
                    >
                      <Download className="h-4 w-4" />
                      {downloading === batch.id ? "Downloading..." : "Download"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkProcessedClick(batch.id)}
                      disabled={processing === batch.id || downloading === batch.id}
                      className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {processing === batch.id ? "Processing..." : "Mark Processed"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(batch.id)}
                      disabled={deleting === batch.id || processing === batch.id}
                      className="gap-1.5 text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting === batch.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image batch? This action cannot be undone and the images will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Processed Confirmation Dialog */}
      <AlertDialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Processed</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this batch as processed? This will delete the images from storage since they've been handled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkProcessedConfirm} className="bg-emerald-600 hover:bg-emerald-700">
              Mark Processed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
