"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * URL Router Hook for Document Overlay
 * 
 * This hook provides URL synchronization for the document overlay without
 * modifying any existing overlay code. It wraps the existing open/close
 * functions from the app context.
 * 
 * Usage:
 * const { openDocumentWithURL, closeDocumentWithURL } = useDocumentURLRouter(
 *   existingOpenFunction,
 *   existingCloseFunction
 * );
 */
export function useDocumentURLRouter(
  existingOpenFn: (id: string | null) => void,
  existingCloseFn: () => void
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check URL on mount and open document if ?doc= parameter exists
  useEffect(() => {
    const docId = searchParams.get("doc");
    if (docId) {
      existingOpenFn(docId);
    }
  }, []); // Only run on mount

  // Function to open document and update URL
  const openDocumentWithURL = useCallback(
    (id: string) => {
      // Update URL first
      router.push(`/browse?doc=${id}`, { scroll: false });
      // Then call existing open function
      existingOpenFn(id);
    },
    [router, existingOpenFn]
  );

  // Function to close document and clear URL
  const closeDocumentWithURL = useCallback(() => {
    // Clear URL first
    router.push("/browse", { scroll: false });
    // Then call existing close function
    existingCloseFn();
  }, [router, existingCloseFn]);

  return {
    openDocumentWithURL,
    closeDocumentWithURL,
  };
}
