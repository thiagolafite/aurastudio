import { NextResponse } from "next/server";
import { getCredentials } from "@/lib/credentials";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const clientId = reqUrl.searchParams.get("clientId") || "";

  const creds = await getCredentials();
  const appId = creds.instagramAppId;
  const configId = creds.instagramConfigId;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || reqUrl.origin).replace(/\/$/, "");

  if (!appId) {
    return NextResponse.redirect(`${appUrl}/?oauth=setup_instagram`);
  }

  const redirectUri = `${appUrl}/api/oauth/instagram/callback`;

  // 1. Meta 2026 Unified Login (recommended: allows Instagram or Facebook login, no FB Page required)
  if (configId) {
    const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("config_id", configId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("override_default_response_type", "true");
    authUrl.searchParams.set("state", clientId);
    return NextResponse.redirect(authUrl.toString());
  }

  // 2. Fallback: Direct Instagram Login (when no config_id is provided)
  const scopes = [
    "instagram_business_basic",
    "instagram_business_content_publish",
  ].join(",");

  const authUrl = new URL("https://www.instagram.com/oauth/authorize");
  authUrl.searchParams.set("enable_fb_login", "0");
  authUrl.searchParams.set("force_authentication", "1");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", clientId);

  return NextResponse.redirect(authUrl.toString());
}
