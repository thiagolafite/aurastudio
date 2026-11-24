import type { PublishLogEntry, ScheduledPost, SocialAccount } from "@/types";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";
const INSTAGRAM_GRAPH_API_BASE = "https://graph.instagram.com/v21.0";

function getInstagramGraphBase(account: SocialAccount): string {
  if (
    account.authProvider === "instagram" ||
    account.accessToken?.trim().startsWith("IG")
  ) {
    return INSTAGRAM_GRAPH_API_BASE;
  }
  return GRAPH_API_BASE;
}

function resolvePublicMediaUrl(mediaUrl?: string): string | null {
  if (!mediaUrl) return null;
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) return null;
  return `${appUrl}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
}

export async function publishToInstagram(
  post: ScheduledPost,
  account: SocialAccount
): Promise<PublishLogEntry> {
  const now = new Date().toISOString();

  if (account.mode === "simulation" || !account.accessToken || !account.externalAccountId) {
    return {
      platform: "instagram",
      status: "published",
      mode: "simulation",
      externalPostId: `sim_ig_${Date.now().toString().slice(-6)}`,
      message: `Publicado no Instagram (${post.placement.toUpperCase()}) para ${account.username} em Modo Simulação.`,
      timestamp: now,
    };
  }

  const publicMediaUrl = resolvePublicMediaUrl(post.mediaUrl);
  if (!publicMediaUrl) {
    return {
      platform: "instagram",
      status: "failed",
      mode: "live",
      message:
        "Instagram API exige uma URL pública de mídia (configure Vercel Blob ou NEXT_PUBLIC_APP_URL e exporte a arte).",
      timestamp: now,
    };
  }

  const fullCaption = [post.caption, post.hashtags.join(" ")].filter(Boolean).join("\n\n");

  try {
    const containerParams = new URLSearchParams({
      access_token: account.accessToken,
    });

    if (post.placement === "story") {
      containerParams.set("media_type", "STORIES");
      if (post.mediaType === "video") {
        containerParams.set("video_url", publicMediaUrl);
      } else {
        containerParams.set("image_url", publicMediaUrl);
      }
    } else if (post.placement === "reels" || post.mediaType === "video") {
      containerParams.set("media_type", "REELS");
      containerParams.set("video_url", publicMediaUrl);
      containerParams.set("caption", fullCaption);
    } else {
      containerParams.set("image_url", publicMediaUrl);
      containerParams.set("caption", fullCaption);
    }

    const igGraphBase = getInstagramGraphBase(account);
    const createRes = await fetch(
      `${igGraphBase}/${account.externalAccountId}/media`,
      {
        method: "POST",
        body: containerParams,
      }
    );
    const createData = (await createRes.json()) as { id?: string; error?: { message: string } };
    if (!createRes.ok || !createData.id) {
      throw new Error(createData.error?.message || "Falha ao criar container de mídia no Instagram.");
    }

    const publishParams = new URLSearchParams({
      creation_id: createData.id,
      access_token: account.accessToken,
    });
    const publishRes = await fetch(
      `${igGraphBase}/${account.externalAccountId}/media_publish`,
      {
        method: "POST",
        body: publishParams,
      }
    );
    const publishData = (await publishRes.json()) as { id?: string; error?: { message: string } };
    if (!publishRes.ok || !publishData.id) {
      throw new Error(publishData.error?.message || "Falha ao publicar container no Instagram.");
    }

    return {
      platform: "instagram",
      status: "published",
      mode: "live",
      externalPostId: publishData.id,
      message: `Publicado automaticamente no Instagram (${post.placement.toUpperCase()}).`,
      timestamp: now,
    };
  } catch (error) {
    return {
      platform: "instagram",
      status: "failed",
      mode: "live",
      message: error instanceof Error ? error.message : "Erro desconhecido na Meta Graph API.",
      timestamp: now,
    };
  }
}

export async function publishToFacebook(
  post: ScheduledPost,
  account: SocialAccount
): Promise<PublishLogEntry> {
  const now = new Date().toISOString();

  if (account.mode === "simulation" || !account.accessToken || !account.externalAccountId) {
    return {
      platform: "facebook",
      status: "published",
      mode: "simulation",
      externalPostId: `sim_fb_${Date.now().toString().slice(-6)}`,
      message: `Publicado na Página do Facebook (${post.placement.toUpperCase()}) para ${account.accountName} em Modo Simulação.`,
      timestamp: now,
    };
  }

  const publicMediaUrl = resolvePublicMediaUrl(post.mediaUrl);
  const fullCaption = [
    post.caption,
    post.externalUrl ? `Acesse: ${post.externalUrl}` : "",
    post.hashtags.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    if (post.placement === "story" && publicMediaUrl) {
      // Step 1: Upload unpublished photo, Step 2: publish to photo_stories
      const uploadParams = new URLSearchParams({
        url: publicMediaUrl,
        published: "false",
        access_token: account.accessToken,
      });
      const uploadRes = await fetch(`${GRAPH_API_BASE}/${account.externalAccountId}/photos`, {
        method: "POST",
        body: uploadParams,
      });
      const uploadData = (await uploadRes.json()) as { id?: string; error?: { message: string } };
      if (!uploadRes.ok || !uploadData.id) {
        throw new Error(uploadData.error?.message || "Falha ao enviar foto para Story do Facebook.");
      }

      const storyParams = new URLSearchParams({
        photo_id: uploadData.id,
        access_token: account.accessToken,
      });
      const storyRes = await fetch(
        `${GRAPH_API_BASE}/${account.externalAccountId}/photo_stories`,
        {
          method: "POST",
          body: storyParams,
        }
      );
      const storyData = (await storyRes.json()) as {
        post_id?: string;
        success?: boolean;
        error?: { message: string };
      };
      if (!storyRes.ok) {
        throw new Error(storyData.error?.message || "Falha ao publicar Story no Facebook.");
      }

      return {
        platform: "facebook",
        status: "published",
        mode: "live",
        externalPostId: storyData.post_id || uploadData.id,
        message: "Publicado automaticamente nos Stories da Página do Facebook.",
        timestamp: now,
      };
    }

    const endpoint = publicMediaUrl
      ? `${GRAPH_API_BASE}/${account.externalAccountId}/photos`
      : `${GRAPH_API_BASE}/${account.externalAccountId}/feed`;

    const params = new URLSearchParams({
      access_token: account.accessToken,
    });
    if (publicMediaUrl) {
      params.set("url", publicMediaUrl);
      params.set("caption", fullCaption);
    } else {
      params.set("message", fullCaption);
    }

    const res = await fetch(endpoint, { method: "POST", body: params });
    const data = (await res.json()) as { id?: string; post_id?: string; error?: { message: string } };
    if (!res.ok || (!data.id && !data.post_id)) {
      throw new Error(data.error?.message || "Falha ao publicar na Página do Facebook.");
    }

    return {
      platform: "facebook",
      status: "published",
      mode: "live",
      externalPostId: data.post_id || data.id,
      message: "Publicado automaticamente no Feed da Página do Facebook.",
      timestamp: now,
    };
  } catch (error) {
    return {
      platform: "facebook",
      status: "failed",
      mode: "live",
      message: error instanceof Error ? error.message : "Erro desconhecido na API do Facebook.",
      timestamp: now,
    };
  }
}
