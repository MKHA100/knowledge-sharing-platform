import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface UploadedFile {
  key: string;
  url: string;
  size: number;
}

export async function uploadToR2(
  file: Buffer,
  originalName: string,
  contentType: string,
  folder: "documents" | "thumbnails" | "pending" = "documents",
): Promise<UploadedFile> {
  const extension = originalName.split(".").pop() || "pdf";
  const key = `${folder}/${uuidv4()}.${extension}`;

  await R2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  return {
    key,
    url: `${process.env.R2_PUBLIC_URL}/${key}`,
    size: file.length,
  };
}

export async function deleteFromR2(key: string): Promise<void> {
  await R2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
  filename?: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ResponseContentDisposition: filename 
      ? `attachment; filename="${filename}"`
      : 'attachment',
  });

  return getSignedUrl(R2, command, { expiresIn });
}

export async function moveFile(
  oldKey: string,
  newFolder: "documents" | "thumbnails",
): Promise<string> {
  // Get the file
  const getCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: oldKey,
  });

  const response = await R2.send(getCommand);
  const body = await response.Body?.transformToByteArray();

  if (!body) throw new Error("Failed to read file");

  // Upload to new location
  const fileName = oldKey.split("/").pop()!;
  const newKey = `${newFolder}/${fileName}`;

  await R2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: newKey,
      Body: body,
      ContentType: response.ContentType,
    }),
  );

  // Delete old file
  await deleteFromR2(oldKey);

  return `${process.env.R2_PUBLIC_URL}/${newKey}`;
}
