import { NextResponse } from "next/server";
import { getClientById, updateClient } from "@/lib/db";
import { getCredentials } from "@/lib/credentials";

const FB_GRAPH = "https://graph.facebook.com/v21.0";
const IG_API_TOKEN = "https://api.instagram.com/oauth/access_token";
const IG_GRAPH = "https://graph.instagram.com";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const rawCode = reqUrl.searchParams.get("code");
  const code = rawCode ? rawCode.replace(/#_$/, "") : null;
  const clientId = reqUrl.searchParams.get("state") || "";
  const errorDesc =
    reqUrl.searchParams.get("error_description") ||
    reqUrl.searchParams.get("error_reason");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || reqUrl.origin).replace(/\/$/, "");

  if (errorDesc || !code) {
    return NextResponse.redirect(
      `${appUrl}/?oauth=error&msg=${encodeURIComponent(
        errorDesc || "Autorização do Instagram cancelada."
      )}`
    );
  }

  const creds = await getCredentials();
  const appId = creds.instagramAppId;
  const appSecret = creds.instagramAppSecret;
  const configId = creds.instagramConfigId;

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      `${appUrl}/?oauth=error&msg=${encodeURIComponent(
        "INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET não configurados."
      )}`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/oauth/instagram/callback`;

    // =====================================================================
    // PATH A: Meta Unified Login (config_id) -> graph.facebook.com + SUAT
    // =====================================================================
    if (configId) {
      const tokenRes = await fetch(
        `${FB_GRAPH}/oauth/access_token?client_id=${encodeURIComponent(
          appId
        )}&client_secret=${encodeURIComponent(appSecret)}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&code=${encodeURIComponent(code)}`
      );
      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error?: { message?: string };
      };
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(
          tokenData.error?.message || "Falha ao obter token de acesso no Login Unificado."
        );
      }

      const accessToken = tokenData.access_token;

      // 1. Try /me/assigned_instagram_accounts (Unified Login SUAT)
      let igId = "";
      let igUsername = "";
      let igName = "";

      const assignedRes = await fetch(
        `${FB_GRAPH}/me/assigned_instagram_accounts?fields=id,username,name&access_token=${encodeURIComponent(
          accessToken
        )}`
      );
      const assignedData = (await assignedRes.json()) as {
        data?: Array<{ id: string; username?: string; name?: string }>;
      };

      if (assignedData.data && assignedData.data.length > 0) {
        const first = assignedData.data[0];
        igId = first.id;
        igUsername = first.username ? `@${first.username}` : "";
        igName = first.name || igUsername || "Instagram";
      } else {
        // 2. Fallback: check /me/accounts linked instagram_business_account
        const pagesRes = await fetch(
          `${FB_GRAPH}/me/accounts?fields=id,name,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(
            accessToken
          )}`
        );
        const pagesData = (await pagesRes.json()) as {
          data?: Array<{
            instagram_business_account?: { id: string; username?: string; name?: string };
          }>;
        };
        const linked = pagesData.data?.find((p) => p.instagram_business_account)
          ?.instagram_business_account;
        if (linked) {
          igId = linked.id;
          igUsername = linked.username ? `@${linked.username}` : "";
          igName = linked.name || igUsername || "Instagram";
        }
      }

      if (!igId) {
        throw new Error(
          "Nenhuma conta profissional do Instagram foi compartilhada no login. Certifique-se de selecionar seu perfil comercial/criador."
        );
      }

      const client = await getClientById(clientId);
      if (client) {
        const now = new Date().toISOString();
        const updatedAccounts = client.accounts.map((acc) =>
          acc.platform === "instagram"
            ? {
                ...acc,
                connected: true,
                mode: "live" as const,
                authProvider: "meta" as const,
                accountName: igName,
                username: igUsername || acc.username,
                externalAccountId: igId,
                accessToken,
                lastSyncedAt: now,
              }
            : acc
        );
        await updateClient(client.id, { accounts: updatedAccounts });
      }

      return NextResponse.redirect(`${appUrl}/?oauth=instagram_connected`);
    }

    // =====================================================================
    // PATH B: Legacy Direct Instagram Login -> graph.instagram.com
    // =====================================================================
    const form = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(IG_API_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      user_id?: string | number;
      error_message?: string;
      error?: { message?: string };
    };

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_message ||
          tokenData.error?.message ||
          "Falha ao obter token de acesso do Instagram."
      );
    }

    const longRes = await fetch(
      `${IG_GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
        appSecret
      )}&access_token=${encodeURIComponent(tokenData.access_token)}`
    );
    const longData = (await longRes.json()) as { access_token?: string };
    const finalToken = longData.access_token || tokenData.access_token;

    const meRes = await fetch(
      `${IG_GRAPH}/v21.0/me?fields=user_id,username,name,account_type&access_token=${encodeURIComponent(
        finalToken
      )}`
    );
    const meData = (await meRes.json()) as {
      id?: string;
      user_id?: string;
      username?: string;
      name?: string;
      error?: { message?: string };
    };

    if (!meRes.ok || meData.error) {
      throw new Error(
        meData.error?.message ||
          "Não foi possível ler o perfil do Instagram. Verifique se a conta é Profissional."
      );
    }

    const igUserId = String(meData.user_id || meData.id || tokenData.user_id || "");
    const igUsername = meData.username ? `@${meData.username}` : undefined;
    const igName = meData.name || igUsername || "Instagram";

    const client = await getClientById(clientId);
    if (client) {
      const now = new Date().toISOString();
      const updatedAccounts = client.accounts.map((acc) =>
        acc.platform === "instagram"
          ? {
              ...acc,
              connected: true,
              mode: "live" as const,
              authProvider: "instagram" as const,
              accountName: igName,
              username: igUsername || acc.username,
              externalAccountId: igUserId || acc.externalAccountId,
              accessToken: finalToken,
              lastSyncedAt: now,
            }
          : acc
      );
      await updateClient(client.id, { accounts: updatedAccounts });
    }

    return NextResponse.redirect(`${appUrl}/?oauth=instagram_connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao conectar Instagram.";
    return NextResponse.redirect(`${appUrl}/?oauth=error&msg=${encodeURIComponent(msg)}`);
  }
}
