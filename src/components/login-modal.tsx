"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";

export function LoginModal() {
  const { showLoginModal, setShowLoginModal } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (showLoginModal) {
      // Redirect to Clerk's sign-in page
      setShowLoginModal(false);
      router.push("/sign-in");
    }
  }, [showLoginModal, setShowLoginModal, router]);

  // No UI needed - just redirects to Clerk's built-in sign-in page
  return null;
}
