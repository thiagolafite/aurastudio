import { NextResponse } from "next/server";
import type { Platform } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      platform?: Platform;
      externalAccountId?: string;
      accessToken?: string;
      mode?: "simulation" | "live";
      authProvider?: "meta" | "instagram";
    };

    if (!body.platform) {
      return NextResponse.json({ ok: false, message: "Plataforma não informada." }, { status: 400 });
    }

    if (body.mode === "simulation") {
      return NextResponse.json({
        ok: true,
        message: "Modo Simulação ativo — pronto para testes locais sem token oficial.",
      });
    }

    if (!body.accessToken?.trim()) {
      return NextResponse.json(
        { ok: false, message: "Cole o Access Token ou conecte via OAuth primeiro." },
        { status: 400 }
      );
    }

    if (body.platform === "instagram" || body.platform === "facebook") {
      const token = body.accessToken.trim();
      const useDirectInstagram =
        body.platform === "instagram" &&
        (body.authProvider === "instagram" || token.startsWith("IG"));

      const graphBase = useDirectInstagram
        ? "https://graph.instagram.com/v21.0"
        : "https://graph.facebook.com/v21.0";
      const targetId = useDirectInstagram
        ? "me"
        : body.externalAccountId?.trim() || "me";
      const fields = useDirectInstagram
        ? "user_id,username,name,account_type"
        : body.platform === "instagram"
          ? "id,username,name"
          : "id,name";
      const url = `${graphBase}/${encodeURIComponent(
        targetId
      )}?fields=${fields}&access_token=${encodeURIComponent(token)}`;

      const res = await fetch(url);
      const data = (await res.json()) as {
        id?: string;
        user_id?: string;
        name?: string;
        username?: string;
        account_type?: string;
        error?: { message?: string };
      };

      if (!res.ok || data.error) {
        return NextResponse.json({
          ok: false,
          message: `Erro ${useDirectInstagram ? "Instagram" : "Meta"} API: ${
            data.error?.message || "Token ou ID inválido."
          }`,
        });
      }

      const resolvedId = data.user_id || data.id;
      return NextResponse.json({
        ok: true,
        message: `Conectado com sucesso! Conta verificada: ${
          data.username ? `@${data.username}` : data.name || resolvedId
        } (ID: ${resolvedId})`,
        externalAccountId: resolvedId,
        accountName: data.name,
        username: data.username ? `@${data.username}` : data.name,
      });
    }

    if (body.platform === "tiktok") {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username",
        {
          headers: {
            Authorization: `Bearer ${body.accessToken.trim()}`,
          },
        }
      );
      const data = (await res.json()) as {
        data?: { user?: { open_id?: string; display_name?: string; username?: string } };
        error?: { code?: string; message?: string };
      };

      if (!res.ok || (data.error?.code && data.error.code !== "ok")) {
        return NextResponse.json({
          ok: false,
          message: `Erro TikTok API: ${data.error?.message || "Token inválido ou expirado."}`,
        });
      }

      const user = data.data?.user;
      return NextResponse.json({
        ok: true,
        message: `Conectado ao TikTok! Perfil: ${
          user?.username ? `@${user.username}` : user?.display_name || "Verificado"
        }`,
        username: user?.username ? `@${user.username}` : user?.display_name,
      });
    }

    return NextResponse.json({ ok: false, message: "Plataforma não suportada." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Erro ao testar conexão.",
      },
      { status: 500 }
    );
  }
}
