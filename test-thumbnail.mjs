import { getDocumentProxy, renderPageAsImage } from "unpdf";
import sharp from "sharp";
import * as canvas from "canvas";

const testUrl = "https://pub-65ae143468264a87b25b36faf55cce3a.r2.dev/documents/491f987b-1412-44ba-bb2e-93077ec2ac99.pdf";

async function testThumbnail() {
  console.log("Fetching PDF...");
  const response = await fetch(testUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch: " + response.statusText);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);
  console.log("Downloaded PDF: " + pdfBuffer.length + " bytes");
  
  console.log("Loading PDF document...");
  const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
  console.log("PDF loaded with " + pdf.numPages + " pages");
  
  console.log("Rendering page 1...");
  const imageResult = await renderPageAsImage(pdf, 1, {
    scale: 0.5,
    width: 400,
    canvasImport: async () => canvas,
  });
  console.log("Page rendered, image size: " + imageResult.length + " bytes");
  
  console.log("Converting to JPEG...");
  const jpegBuffer = await sharp(imageResult)
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();
  console.log("JPEG created: " + jpegBuffer.length + " bytes");
  
  await pdf.destroy();
  console.log("TEST PASSED - Thumbnail generation works!");
  
  return jpegBuffer;
}

testThumbnail()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("TEST FAILED:", err.message);
    process.exit(1);
  });
