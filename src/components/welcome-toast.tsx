"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function WelcomeToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const welcome = searchParams.get("welcome");

  useEffect(() => {
    if (welcome === "signin") {
      toast.success("Welcome back! 👋", {
        description:
          "Great to see you again. Let's continue helping fellow students succeed!",
        duration: 5000,
      });
      // Remove the query parameter from URL
      router.replace("/", { scroll: false });
    } else if (welcome === "signup") {
      toast.success("Welcome to StudyShare! 🎉", {
        description:
          "You're now part of our learning family. Thank you for joining us in helping students across Sri Lanka!",
        duration: 6000,
      });
      // Remove the query parameter from URL
      router.replace("/", { scroll: false });
    }
  }, [welcome, router]);

  return null;
}
