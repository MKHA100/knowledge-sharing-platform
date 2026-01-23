import { Suspense } from "react";
import { BrowseClientContent, BrowseLoadingSkeleton } from "./_components/browse-client-content";

/**
 * Browse Page - All Subjects
 * 
 * This is the main browse page showing all documents.
 * Subject-specific views are handled by /browse/[subject]/page.tsx
 * 
 * URL Structure:
 * - /browse - All subjects
 * - /browse?type=paper - Filtered by type
 * - /browse?lang=sinhala - Filtered by language  
 * - /browse?sort=newest - Sorted
 * - /browse?q=mathematics - Search query
 * - /browse?doc=<uuid> - Document overlay
 */
export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseLoadingSkeleton />}>
      <BrowseClientContent subjectId={null} />
    </Suspense>
  );
}
