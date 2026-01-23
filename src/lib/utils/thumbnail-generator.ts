/**
 * PDF Thumbnail Generator (Server-Side)
 *
 * Uses MuPDF library which is specifically designed for Node.js.
 * No Web Workers, no browser dependencies - pure server-side rendering.
 */

import * as mupdf from "mupdf";
import sharp from "sharp";

/**
 * Generate a thumbnail image from the first page of a PDF
 *
 * @param pdfBuffer - Buffer containing the PDF file data
 * @param maxWidth - Maximum width of the thumbnail (default: 600px)
 * @param quality - JPEG quality for compression (default: 85)
 * @returns Promise<Buffer> - Buffer containing the JPEG image data
 */
export async function generatePDFThumbnail(
  pdfBuffer: Buffer,
  maxWidth: number = 600,
  quality: number = 85
): Promise<Buffer> {
  // Open the PDF document from buffer
  const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf");

  try {
    // Get the first page
    const page = doc.loadPage(0);

    // Get page bounds to calculate scale
    const bounds = page.getBounds();
    const pageWidth = bounds[2] - bounds[0];
    const pageHeight = bounds[3] - bounds[1];

    // Calculate scale factor based on maxWidth
    const scale = maxWidth / pageWidth;
    const scaledWidth = Math.floor(pageWidth * scale);
    const scaledHeight = Math.floor(pageHeight * scale);

    // Create a pixmap (rasterized image) of the page
    const matrix = mupdf.Matrix.scale(scale, scale);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);

    // Get PNG data from pixmap
    const pngData = pixmap.asPNG();

    // Convert to JPEG using sharp for better compression
    const jpegBuffer = await sharp(Buffer.from(pngData))
      .resize(scaledWidth, scaledHeight, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    return jpegBuffer;
  } finally {
    // Clean up - MuPDF handles memory automatically
  }
}

/**
 * Generate thumbnail from a PDF file URL
 * Downloads the PDF and generates a thumbnail
 *
 * @param pdfUrl - URL to the PDF file
 * @param maxWidth - Maximum width of the thumbnail (default: 600px)
 * @param quality - JPEG quality for compression (default: 85)
 * @returns Promise<Buffer> - Buffer containing the JPEG image data
 */
export async function generateThumbnailFromURL(
  pdfUrl: string,
  maxWidth: number = 600,
  quality: number = 85
): Promise<Buffer> {
  // Fetch the PDF file
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }

  // Convert to buffer
  const arrayBuffer = await response.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  // Generate thumbnail
  return await generatePDFThumbnail(pdfBuffer, maxWidth, quality);
}

/**
 * Validate if a buffer is a valid PDF
 *
 * @param buffer - Buffer to validate
 * @returns boolean - True if valid PDF
 */
export function isValidPDF(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  const pdfHeader = buffer.toString("utf8", 0, 5);
  return pdfHeader === "%PDF-";
}
