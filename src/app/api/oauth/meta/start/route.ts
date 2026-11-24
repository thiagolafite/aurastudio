import { NextResponse } from "next/server";
import { getCredentials } from "@/lib/credentials";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || "";

  const creds = await getCredentials();
  const appId = creds.metaAppId;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  if (!appId) {
    return NextResponse.redirect(`${appUrl}/?oauth=setup_meta`);
  }

  const redirectUri = `${appUrl}/api/oauth/meta/callback`;
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", clientId);

  return NextResponse.redirect(authUrl.toString());
}
