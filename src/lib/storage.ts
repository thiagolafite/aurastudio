import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { put } from "@vercel/blob";

export function getUploadsDir(): string {
  return process.env.VERCEL
    ? path.join("/tmp", "aurastudio-uploads")
    : path.join(process.cwd(), "public", "uploads");
}

export interface StoredMedia {
  url: string;
  storageMode: "vercel-blob" | "local";
}

export async function saveMediaBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<StoredMedia> {
  const ext = path.extname(filename) || (contentType.includes("png") ? ".png" : ".jpg");
  const safeName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`social-studio/${safeName}`, buffer, {
      access: "public",
      contentType,
    });
    return {
      url: blob.url,
      storageMode: "vercel-blob",
    };
  }

  const uploadsDir = getUploadsDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  const targetPath = path.join(uploadsDir, safeName);
  await fs.writeFile(targetPath, buffer);

  return {
    url: `/api/uploads/${safeName}`,
    storageMode: "local",
  };
}
