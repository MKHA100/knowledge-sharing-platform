/**
 * PDF Converter Utility
 * Converts images, Word documents, and text files to PDF format
 * All documents in the system are stored as PDFs
 */

import { PDFDocument, PageSizes, rgb } from "pdf-lib";

/**
 * Check if a file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Check if a file is a Word document
 */
export function isWordDocument(mimeType: string): boolean {
  return (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

/**
 * Check if a file is a text file
 */
export function isTxtFile(mimeType: string): boolean {
  return mimeType === "text/plain";
}

/**
 * Check if a file is already a PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/**
 * Convert an image buffer to PDF
 * Supports JPEG, PNG formats
 */
export async function convertImageToPdf(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Embed the image based on type
  let image;
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    image = await pdfDoc.embedJpg(imageBuffer);
  } else if (mimeType === "image/png") {
    image = await pdfDoc.embedPng(imageBuffer);
  } else {
    throw new Error(`Unsupported image format: ${mimeType}`);
  }

  // Calculate page size to fit the image
  const { width, height } = image;

  // Use A4 as base, scale image to fit
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];

  // Calculate scaling to fit image on page with margins
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Add page and draw image centered
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;

  page.drawImage(image, {
    x,
    y,
    width: scaledWidth,
    height: scaledHeight,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Convert multiple images to a single PDF
 * Each image becomes a page
 */
export async function convertImagesToPdf(
  images: Array<{ buffer: Buffer; mimeType: string }>,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const { buffer, mimeType } of images) {
    let image;
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      image = await pdfDoc.embedJpg(buffer);
    } else if (mimeType === "image/png") {
      image = await pdfDoc.embedPng(buffer);
    } else {
      console.warn(`Skipping unsupported image format: ${mimeType}`);
      continue;
    }

    const { width, height } = image;
    const pageWidth = PageSizes.A4[0];
    const pageHeight = PageSizes.A4[1];
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Convert text file to PDF
 * Wraps text with proper formatting and pagination
 */
export async function convertTxtToPdf(txtBuffer: Buffer): Promise<Buffer> {
  // Decode text from buffer (assume UTF-8)
  const text = txtBuffer.toString("utf-8");

  // Create PDF with text content
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont("Helvetica" as never);

  const fontSize = 12;
  const lineHeight = fontSize * 1.5;
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  // Split text into lines and wrap if needed
  const lines = text.split("\n");
  for (const line of lines) {
    // Wrap long lines
    const words = line.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && currentLine) {
        // Draw current line
        currentPage.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
        currentLine = word;

        // Check if we need a new page
        if (yPosition < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
      } else {
        currentLine = testLine;
      }
    }

    // Draw the last line
    if (currentLine) {
      currentPage.drawText(currentLine, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    // Check if we need a new page
    if (yPosition < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Convert Word document to PDF
 * Uses mammoth to extract HTML, then converts to PDF
 */
export async function convertWordToPdf(docBuffer: Buffer): Promise<Buffer> {
  // Dynamic import mammoth to avoid bundling issues
  const mammoth = await import("mammoth");

  // Extract text from Word document
  const result = await mammoth.extractRawText({ buffer: docBuffer });
  const text = result.value;

  // Create PDF with extracted text
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont("Helvetica" as never);

  const fontSize = 12;
  const lineHeight = fontSize * 1.5;
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  // Split text into lines that fit the page width
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Create pages and draw text
  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (
      let i = 0;
      i < maxLinesPerPage && lineIndex < lines.length;
      i++, lineIndex++
    ) {
      page.drawText(lines[lineIndex], {
        x: margin,
        y: y - lineHeight,
        size: fontSize,
        font,
      });
      y -= lineHeight;
    }
  }

  // If no content, add empty page
  if (pdfDoc.getPageCount() === 0) {
    pdfDoc.addPage();
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Convert any supported file to PDF
 * Returns the PDF buffer and source type for tracking
 */
export async function convertToPdf(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<{
  pdfBuffer: Buffer;
  sourceType: "pdf" | "converted_image" | "converted_docx" | "converted_txt";
}> {
  if (isPdfFile(mimeType)) {
    return { pdfBuffer: fileBuffer, sourceType: "pdf" };
  }

  if (isImageFile(mimeType)) {
    const pdfBuffer = await convertImageToPdf(fileBuffer, mimeType);
    return { pdfBuffer, sourceType: "converted_image" };
  }

  if (isWordDocument(mimeType)) {
    const pdfBuffer = await convertWordToPdf(fileBuffer);
    return { pdfBuffer, sourceType: "converted_docx" };
  }

  if (isTxtFile(mimeType)) {
    const pdfBuffer = await convertTxtToPdf(fileBuffer);
    return { pdfBuffer, sourceType: "converted_txt" };
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Get the file extension for storage
 */
export function getStorageFileName(originalName: string): string {
  // Remove original extension and add .pdf
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  return `${baseName}.pdf`;
}
