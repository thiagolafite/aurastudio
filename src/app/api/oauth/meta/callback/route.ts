import { NextResponse } from "next/server";
import { getClientById, updateClient } from "@/lib/db";
import { getCredentials } from "@/lib/credentials";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const clientId = searchParams.get("state") || "";
  const errorDesc = searchParams.get("error_description");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  if (errorDesc || !code) {
    return NextResponse.redirect(
      `${appUrl}/?oauth=error&msg=${encodeURIComponent(errorDesc || "Autorização cancelada.")}`
    );
  }

  const creds = await getCredentials();
  const appId = creds.metaAppId;
  const appSecret = creds.metaAppSecret;
  if (!appId || !appSecret) {
    return NextResponse.redirect(
      `${appUrl}/?oauth=error&msg=${encodeURIComponent("META_APP_ID/META_APP_SECRET ausentes.")}`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/oauth/meta/callback`;

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`
    );
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: { message: string } };
    if (!tokenData.access_token) {
      throw new Error(tokenData.error?.message || "Falha ao obter token Meta.");
    }

    // 2. Exchange for 60-day long-lived user token
    const longRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
        appId
      )}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(
        tokenData.access_token
      )}`
    );
    const longData = (await longRes.json()) as { access_token?: string };
    const userToken = longData.access_token || tokenData.access_token;

    // 3. Fetch managed Facebook Pages + linked Instagram Business Accounts
    const pagesRes = await fetch(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(
        userToken
      )}`
    );
    const pagesData = (await pagesRes.json()) as {
      data?: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: { id: string; username?: string; name?: string };
      }>;
    };

    const firstPage = pagesData.data?.[0];
    if (!firstPage) {
      throw new Error("Nenhuma Página do Facebook encontrada nesta conta Meta.");
    }

    const client = await getClientById(clientId);
    if (client) {
      const ig = firstPage.instagram_business_account;
      const now = new Date().toISOString();
      const updatedAccounts = client.accounts.map((acc) => {
        if (acc.platform === "facebook") {
          return {
            ...acc,
            connected: true,
            mode: "live" as const,
            accountName: firstPage.name,
            username: firstPage.name,
            externalAccountId: firstPage.id,
            accessToken: firstPage.access_token,
            lastSyncedAt: now,
          };
        }
        if (acc.platform === "instagram" && ig) {
          return {
            ...acc,
            connected: true,
            mode: "live" as const,
            accountName: ig.name || firstPage.name,
            username: ig.username ? `@${ig.username}` : acc.username,
            externalAccountId: ig.id,
            accessToken: firstPage.access_token,
            lastSyncedAt: now,
          };
        }
        return acc;
      });

      await updateClient(client.id, { accounts: updatedAccounts });
    }

    return NextResponse.redirect(`${appUrl}/?oauth=meta_connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao conectar Meta.";
    return NextResponse.redirect(`${appUrl}/?oauth=error&msg=${encodeURIComponent(msg)}`);
  }
}
