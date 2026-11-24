import { NextResponse } from "next/server";
import { getClientById, updateClient } from "@/lib/db";
import { getCredentials } from "@/lib/credentials";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const clientId = searchParams.get("state") || "";
  const errorDesc = searchParams.get("error_description");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  if (errorDesc || !code) {
    return NextResponse.redirect(
      `${appUrl}/?oauth=error&msg=${encodeURIComponent(errorDesc || "Autorização TikTok cancelada.")}`
    );
  }

  const creds = await getCredentials();
  const clientKey = creds.tiktokClientKey;
  const clientSecret = creds.tiktokClientSecret;
  if (!clientKey || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/?oauth=error&msg=${encodeURIComponent("TIKTOK_CLIENT_KEY/SECRET ausentes.")}`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/oauth/tiktok/callback`;
    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      open_id?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || "Falha ao obter token do TikTok.");
    }

    const client = await getClientById(clientId);
    if (client) {
      const now = new Date().toISOString();
      const updatedAccounts = client.accounts.map((acc) =>
        acc.platform === "tiktok"
          ? {
              ...acc,
              connected: true,
              mode: "live" as const,
              externalAccountId: tokenData.open_id || acc.externalAccountId,
              accessToken: tokenData.access_token,
              lastSyncedAt: now,
            }
          : acc
      );
      await updateClient(client.id, { accounts: updatedAccounts });
    }

    return NextResponse.redirect(`${appUrl}/?oauth=tiktok_connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao conectar TikTok.";
    return NextResponse.redirect(`${appUrl}/?oauth=error&msg=${encodeURIComponent(msg)}`);
  }
}
