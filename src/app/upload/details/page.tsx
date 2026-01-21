import { Suspense } from "react";
import Loading from "./loading";
import { UploadDetailsContent } from "./upload-details-content";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast-provider";
import { LoginModal } from "@/components/login-modal";

export default function UploadDetailsPage() {
  return (
    <AppProvider>
      <ToastProvider />
      <Suspense fallback={<Loading />}>
        <UploadDetailsContent />
      </Suspense>
      <LoginModal />
    </AppProvider>
  );
}
