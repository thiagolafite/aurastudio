import fs from "node:fs/promises";
import path from "node:path";

export interface AppCredentials {
  instagramAppId?: string;
  instagramAppSecret?: string;
  instagramConfigId?: string;
  metaAppId?: string;
  metaAppSecret?: string;
  tiktokClientKey?: string;
  tiktokClientSecret?: string;
  geminiApiKey?: string;
}

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "aurastudio-data")
  : path.join(process.cwd(), "data");
const CREDS_PATH = path.join(DATA_DIR, "credentials.json");

export async function getCredentials(): Promise<AppCredentials> {
  let fileCreds: AppCredentials = {};
  try {
    const raw = await fs.readFile(CREDS_PATH, "utf-8");
    fileCreds = JSON.parse(raw) as AppCredentials;
  } catch {
    // No local credentials file yet
  }

  return {
    instagramAppId: fileCreds.instagramAppId || process.env.INSTAGRAM_APP_ID || undefined,
    instagramAppSecret:
      fileCreds.instagramAppSecret || process.env.INSTAGRAM_APP_SECRET || undefined,
    instagramConfigId:
      fileCreds.instagramConfigId || process.env.INSTAGRAM_CONFIG_ID || undefined,
    metaAppId: fileCreds.metaAppId || process.env.META_APP_ID || undefined,
    metaAppSecret: fileCreds.metaAppSecret || process.env.META_APP_SECRET || undefined,
    tiktokClientKey: fileCreds.tiktokClientKey || process.env.TIKTOK_CLIENT_KEY || undefined,
    tiktokClientSecret:
      fileCreds.tiktokClientSecret || process.env.TIKTOK_CLIENT_SECRET || undefined,
    geminiApiKey:
      fileCreds.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || undefined,
  };
}

export async function saveCredentials(patch: Partial<AppCredentials>): Promise<AppCredentials> {
  let existing: AppCredentials = {};
  try {
    const raw = await fs.readFile(CREDS_PATH, "utf-8");
    existing = JSON.parse(raw) as AppCredentials;
  } catch {
    // fresh
  }

  const next: AppCredentials = { ...existing };
  if (patch.instagramAppId !== undefined) {
    next.instagramAppId = patch.instagramAppId.trim() || undefined;
  }
  if (patch.instagramAppSecret !== undefined && patch.instagramAppSecret.trim()) {
    next.instagramAppSecret = patch.instagramAppSecret.trim();
  }
  if (patch.instagramConfigId !== undefined) {
    next.instagramConfigId = patch.instagramConfigId.trim() || undefined;
  }
  if (patch.metaAppId !== undefined) next.metaAppId = patch.metaAppId.trim() || undefined;
  if (patch.metaAppSecret !== undefined && patch.metaAppSecret.trim()) {
    next.metaAppSecret = patch.metaAppSecret.trim();
  }
  if (patch.tiktokClientKey !== undefined) {
    next.tiktokClientKey = patch.tiktokClientKey.trim() || undefined;
  }
  if (patch.tiktokClientSecret !== undefined && patch.tiktokClientSecret.trim()) {
    next.tiktokClientSecret = patch.tiktokClientSecret.trim();
  }
  if (patch.geminiApiKey !== undefined && patch.geminiApiKey.trim()) {
    next.geminiApiKey = patch.geminiApiKey.trim();
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CREDS_PATH, JSON.stringify(next, null, 2), "utf-8");
  return getCredentials();
}
