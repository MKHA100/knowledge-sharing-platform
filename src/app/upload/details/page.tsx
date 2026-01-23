import { Suspense } from "react";
import Loading from "./loading";
import { UploadDetailsContent } from "./upload-details-content";
import { LoginModal } from "@/components/login-modal";

export default function UploadDetailsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <UploadDetailsContent />
      <LoginModal />
    </Suspense>
  );
}
