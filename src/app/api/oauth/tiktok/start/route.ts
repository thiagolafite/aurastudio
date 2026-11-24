import { NextResponse } from "next/server";
import { getCredentials } from "@/lib/credentials";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || "";

  const creds = await getCredentials();
  const clientKey = creds.tiktokClientKey;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  if (!clientKey) {
    return NextResponse.redirect(`${appUrl}/?oauth=setup_tiktok`);
  }

  const redirectUri = `${appUrl}/api/oauth/tiktok/callback`;
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", clientKey);
  authUrl.searchParams.set("scope", "user.info.basic,video.publish,video.upload");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", clientId);

  return NextResponse.redirect(authUrl.toString());
}
