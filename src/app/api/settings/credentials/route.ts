import { NextResponse } from "next/server";
import { getCredentials, saveCredentials, type AppCredentials } from "@/lib/credentials";

export async function GET() {
  const creds = await getCredentials();
  return NextResponse.json({
    hasInstagram: Boolean(creds.instagramAppId && creds.instagramAppSecret),
    hasMeta: Boolean(creds.metaAppId && creds.metaAppSecret),
    hasTikTok: Boolean(creds.tiktokClientKey && creds.tiktokClientSecret),
    hasGemini: Boolean(creds.geminiApiKey),
    instagramAppId: creds.instagramAppId || "",
    instagramConfigId: creds.instagramConfigId || "",
    metaAppId: creds.metaAppId || "",
    tiktokClientKey: creds.tiktokClientKey || "",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AppCredentials>;
    const creds = await saveCredentials(body);
    return NextResponse.json({
      ok: true,
      hasInstagram: Boolean(creds.instagramAppId && creds.instagramAppSecret),
      hasMeta: Boolean(creds.metaAppId && creds.metaAppSecret),
      hasTikTok: Boolean(creds.tiktokClientKey && creds.tiktokClientSecret),
      hasGemini: Boolean(creds.geminiApiKey),
      instagramAppId: creds.instagramAppId || "",
      instagramConfigId: creds.instagramConfigId || "",
      metaAppId: creds.metaAppId || "",
      tiktokClientKey: creds.tiktokClientKey || "",
    });
  } catch (error) {
    console.error("POST /api/settings/credentials error:", error);
    return NextResponse.json(
      { error: "Falha ao salvar credenciais." },
      { status: 500 }
    );
  }
}
