import type { PublishLogEntry, ScheduledPost, SocialAccount } from "@/types";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

function resolvePublicMediaUrl(mediaUrl?: string): string | null {
  if (!mediaUrl) return null;
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) return null;
  return `${appUrl}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
}

export async function publishToTikTok(
  post: ScheduledPost,
  account: SocialAccount
): Promise<PublishLogEntry> {
  const now = new Date().toISOString();

  if (account.mode === "simulation" || !account.accessToken) {
    return {
      platform: "tiktok",
      status: "published",
      mode: "simulation",
      externalPostId: `sim_tt_${Date.now().toString().slice(-6)}`,
      message: `Publicado no TikTok (${post.placement.toUpperCase()}) para ${account.username} em Modo Simulação.`,
      timestamp: now,
    };
  }

  const publicMediaUrl = resolvePublicMediaUrl(post.mediaUrl);
  if (!publicMediaUrl) {
    return {
      platform: "tiktok",
      status: "failed",
      mode: "live",
      message: "TikTok Content Posting API exige URL pública de mídia (configure Vercel Blob).",
      timestamp: now,
    };
  }

  const title = [post.caption, post.hashtags.join(" ")].filter(Boolean).join(" ").slice(0, 2200);

  try {
    const isVideo = post.mediaType === "video";
    const endpoint = isVideo
      ? `${TIKTOK_API_BASE}/post/publish/video/init/`
      : `${TIKTOK_API_BASE}/post/publish/content/init/`;

    const payload = isVideo
      ? {
          post_info: {
            title,
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: publicMediaUrl,
          },
        }
      : {
          post_info: {
            title: post.title.slice(0, 90),
            description: title,
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_comment: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            photo_cover_index: 0,
            photo_images: [publicMediaUrl],
          },
          post_mode: "DIRECT_POST",
          media_type: "PHOTO",
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      data?: { publish_id?: string };
      error?: { code?: string; message?: string };
    };

    if (!res.ok || (data.error && data.error.code && data.error.code !== "ok")) {
      throw new Error(data.error?.message || "Falha ao enviar publicação para a API do TikTok.");
    }

    return {
      platform: "tiktok",
      status: "published",
      mode: "live",
      externalPostId: data.data?.publish_id || `tt_${Date.now()}`,
      message: "Enviado automaticamente via TikTok Content Posting API.",
      timestamp: now,
    };
  } catch (error) {
    return {
      platform: "tiktok",
      status: "failed",
      mode: "live",
      message: error instanceof Error ? error.message : "Erro desconhecido na API do TikTok.",
      timestamp: now,
    };
  }
}
