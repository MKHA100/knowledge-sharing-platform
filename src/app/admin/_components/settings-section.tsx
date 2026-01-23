"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Upload, 
  Database, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UploadStatus {
  enabled: boolean;
  reason: string | null;
  autoDisabled: boolean;
}

interface StorageUsage {
  usedBytes: number;
  usedGB: string;
  limitBytes: number;
  limitGB: string;
  percentUsed: number;
  objectCount: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

export function SettingsSection() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [refreshingStorage, setRefreshingStorage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch upload status
      const statusRes = await fetch("/api/admin/settings/upload-status");
      const statusResult = await statusRes.json();
      if (statusResult.success) {
        setUploadStatus(statusResult.data);
      }

      // Fetch storage usage
      const storageRes = await fetch("/api/admin/settings/storage-usage");
      const storageResult = await storageRes.json();
      if (storageResult.success) {
        setStorageUsage(storageResult.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const toggleUploads = async () => {
    if (!uploadStatus) return;

    try {
      setToggling(true);
      const response = await fetch("/api/admin/settings/upload-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: !uploadStatus.enabled,
          reason: uploadStatus.enabled 
            ? "Uploads temporarily paused by admin" 
            : null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setUploadStatus({
          ...uploadStatus,
          enabled: result.data.enabled,
          reason: result.data.enabled ? null : "Uploads temporarily paused by admin",
          autoDisabled: false,
        });
        toast.success(result.data.enabled ? "Uploads enabled" : "Uploads disabled");
      } else {
        toast.error(result.error || "Failed to toggle uploads");
      }
    } catch (error) {
      console.error("Error toggling uploads:", error);
      toast.error("Failed to toggle uploads");
    } finally {
      setToggling(false);
    }
  };

  const refreshStorageUsage = async () => {
    try {
      setRefreshingStorage(true);
      const storageRes = await fetch("/api/admin/settings/storage-usage");
      const storageResult = await storageRes.json();
      if (storageResult.success) {
        setStorageUsage(storageResult.data);
        toast.success("Storage usage updated");
      }
    } catch (error) {
      console.error("Error refreshing storage:", error);
      toast.error("Failed to refresh storage usage");
    } finally {
      setRefreshingStorage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">System Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage system-wide settings and view storage usage
        </p>
      </div>

      {/* Upload Control Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              uploadStatus?.enabled 
                ? "bg-emerald-100" 
                : "bg-rose-100"
            }`}>
              <Upload className={`h-6 w-6 ${
                uploadStatus?.enabled 
                  ? "text-emerald-600" 
                  : "text-rose-600"
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Upload Control</h3>
              <p className="mt-1 text-sm text-slate-500">
                Enable or disable file uploads for all users
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge 
                  variant={uploadStatus?.enabled ? "default" : "destructive"}
                  className={uploadStatus?.enabled 
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                    : ""
                  }
                >
                  {uploadStatus?.enabled ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Uploads Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Uploads Disabled
                    </>
                  )}
                </Badge>
                {uploadStatus?.autoDisabled && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Auto-disabled (Storage Full)
                  </Badge>
                )}
              </div>
              {uploadStatus?.reason && !uploadStatus.enabled && (
                <p className="mt-2 text-sm text-rose-600">
                  Reason: {uploadStatus.reason}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={toggleUploads}
            disabled={toggling}
            variant={uploadStatus?.enabled ? "destructive" : "default"}
            className={!uploadStatus?.enabled ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {toggling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {uploadStatus?.enabled ? "Disable Uploads" : "Enable Uploads"}
          </Button>
        </div>
      </div>

      {/* Storage Usage Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              storageUsage?.isAtLimit 
                ? "bg-rose-100" 
                : storageUsage?.isNearLimit 
                  ? "bg-amber-100" 
                  : "bg-blue-100"
            }`}>
              <Database className={`h-6 w-6 ${
                storageUsage?.isAtLimit 
                  ? "text-rose-600" 
                  : storageUsage?.isNearLimit 
                    ? "text-amber-600" 
                    : "text-blue-600"
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">R2 Storage Usage</h3>
              <p className="mt-1 text-sm text-slate-500">
                Current cloud storage utilization
              </p>
              
              {storageUsage && (
                <div className="mt-4 space-y-3">
                  {/* Progress bar */}
                  <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-slate-100">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        storageUsage.isAtLimit 
                          ? "bg-rose-500" 
                          : storageUsage.isNearLimit 
                            ? "bg-amber-500" 
                            : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(storageUsage.percentUsed, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-slate-900">
                      {storageUsage.usedGB} GB / {storageUsage.limitGB} GB
                    </span>
                    <span className="text-slate-500">
                      ({storageUsage.percentUsed.toFixed(1)}% used)
                    </span>
                    <span className="text-slate-500">
                      {storageUsage.objectCount} objects
                    </span>
                  </div>

                  {storageUsage.isAtLimit && (
                    <div className="flex items-center gap-2 text-sm text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                      Storage limit reached. Uploads have been automatically disabled.
                    </div>
                  )}
                  {storageUsage.isNearLimit && !storageUsage.isAtLimit && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Storage is almost full. Consider cleaning up old files.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={refreshStorageUsage}
            disabled={refreshingStorage}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshingStorage ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Settings className="mt-0.5 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Automatic Upload Disable</p>
            <p className="mt-1 text-blue-700">
              When R2 storage reaches 2GB, uploads will be automatically disabled to prevent storage overages. 
              You can manually enable/disable uploads at any time using the toggle above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
