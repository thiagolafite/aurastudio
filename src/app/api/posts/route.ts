import { NextResponse } from "next/server";
import { createPost, listPosts } from "@/lib/db";
import type { ScheduledPost } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || undefined;
    const posts = await listPosts(clientId);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json({ error: "Falha ao listar postagens." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ScheduledPost>;
    if (!body.clientId || !body.title || !body.platforms?.length) {
      return NextResponse.json(
        { error: "Cliente, título e ao menos uma rede social são obrigatórios." },
        { status: 400 }
      );
    }

    const post = await createPost({
      clientId: body.clientId,
      title: body.title.trim(),
      platforms: body.platforms,
      placement: body.placement || "feed",
      caption: body.caption || "",
      hashtags: body.hashtags || [],
      firstComment: body.firstComment,
      externalUrl: body.externalUrl,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType || "image",
      layoutConfig: body.layoutConfig,
      scheduledAt: body.scheduledAt || new Date().toISOString(),
      status: body.status || "scheduled",
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Falha ao salvar postagem." }, { status: 500 });
  }
}
