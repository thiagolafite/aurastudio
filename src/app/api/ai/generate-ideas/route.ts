import { NextResponse } from "next/server";
import { getClientById } from "@/lib/db";
import { generateLayoutIdeas } from "@/lib/ai";
import type { Placement, Platform } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientId?: string;
      topic?: string;
      goal?: string;
      placement?: Placement;
      platforms?: Platform[];
    };

    if (!body.clientId || !body.topic?.trim()) {
      return NextResponse.json(
        { error: "Selecione um cliente e informe o tema da postagem." },
        { status: 400 }
      );
    }

    const client = await getClientById(body.clientId);
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const result = await generateLayoutIdeas({
      client,
      topic: body.topic.trim(),
      goal: body.goal?.trim() || "Engajamento e vendas",
      placement: body.placement || "feed",
      platforms: body.platforms?.length ? body.platforms : ["instagram", "tiktok", "facebook"],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/ai/generate-ideas error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar ideias de layout com IA." },
      { status: 500 }
    );
  }
}
