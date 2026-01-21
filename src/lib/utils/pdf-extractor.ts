/**
 * Page Extraction Utility for AI Categorization
 * Extracts sample pages from PDF for efficient AI analysis
 * Only sends 2-3 pages to Gemini instead of the full document
 */

import { PDFDocument } from "pdf-lib";

export interface ExtractedPage {
  pageNumber: number;
  pdfBuffer: Buffer;
}

export interface PageSamples {
  pages: ExtractedPage[];
  totalPages: number;
  sampledPageNumbers: number[];
}

/**
 * Extract specific pages from a PDF for AI sampling
 * Default strategy: First 2 pages + middle page (for long documents)
 * This reduces token usage while still giving AI enough context
 */
export async function extractSamplePages(
  pdfBuffer: Buffer,
  maxPages: number = 3,
): Promise<PageSamples> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = srcDoc.getPageCount();

  // Determine which pages to sample
  const pagesToExtract: number[] = [];

  if (totalPages <= maxPages) {
    // If document is short, use all pages
    for (let i = 0; i < totalPages; i++) {
      pagesToExtract.push(i);
    }
  } else {
    // First page (cover/title)
    pagesToExtract.push(0);

    // Second page (often table of contents or intro)
    if (totalPages > 1) {
      pagesToExtract.push(1);
    }

    // Middle page (content sample) - only if we have room and enough pages
    if (maxPages >= 3 && totalPages > 4) {
      const middlePage = Math.floor(totalPages / 2);
      pagesToExtract.push(middlePage);
    }
  }

  // Extract each page as a separate single-page PDF
  const extractedPages: ExtractedPage[] = [];

  for (const pageIndex of pagesToExtract) {
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(srcDoc, [pageIndex]);
    newDoc.addPage(copiedPage);

    const pageBytes = await newDoc.save();
    extractedPages.push({
      pageNumber: pageIndex + 1, // 1-indexed for display
      pdfBuffer: Buffer.from(pageBytes),
    });
  }

  return {
    pages: extractedPages,
    totalPages,
    sampledPageNumbers: pagesToExtract.map((i) => i + 1),
  };
}

/**
 * Create a combined PDF from sample pages for AI analysis
 * This sends one PDF with the sampled pages to Gemini
 */
export async function createSampledPdf(pdfBuffer: Buffer): Promise<Buffer> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= 3) {
    // Document is already short, use as-is
    return pdfBuffer;
  }

  // Create new document with sampled pages
  const newDoc = await PDFDocument.create();

  // Always include first 2 pages
  const pagesToCopy = [0, 1];

  // Add middle page for longer documents
  if (totalPages > 4) {
    pagesToCopy.push(Math.floor(totalPages / 2));
  }

  const copiedPages = await newDoc.copyPages(srcDoc, pagesToCopy);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const sampledBytes = await newDoc.save();
  return Buffer.from(sampledBytes);
}

/**
 * Get metadata about a PDF without extracting pages
 */
export async function getPdfMetadata(
  pdfBuffer: Buffer,
): Promise<{ pageCount: number; title?: string; author?: string }> {
  const doc = await PDFDocument.load(pdfBuffer);

  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle() || undefined,
    author: doc.getAuthor() || undefined,
  };
}

/**
 * Estimate token usage for a PDF
 * Gemini uses approximately 258 tokens per PDF page
 */
export function estimateTokenUsage(pageCount: number): number {
  return pageCount * 258;
}

/**
 * Check if PDF sampling is recommended based on page count
 */
export function shouldSamplePdf(pageCount: number): boolean {
  // Sample if more than 5 pages to save tokens
  return pageCount > 5;
}
