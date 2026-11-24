import { NextResponse } from "next/server";
import { createClient, generateId, listClients } from "@/lib/db";
import type { ClientWorkspace } from "@/types";

export async function GET() {
  try {
    const clients = await listClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json({ error: "Falha ao listar clientes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ClientWorkspace>;
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Nome do cliente é obrigatório." }, { status: 400 });
    }

    const handle =
      body.brandKit?.handle ||
      "@" +
        body.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");

    const client = await createClient({
      name: body.name.trim(),
      niche: body.niche?.trim() || "Negócio local / Marca digital",
      toneOfVoice: body.toneOfVoice?.trim() || "Moderno, próximo e profissional",
      targetAudience: body.targetAudience?.trim() || "Público geral interessado no segmento",
      avatarColor: body.avatarColor || "#6366F1",
      brandKit: body.brandKit || {
        primaryColor: "#0F172A",
        secondaryColor: "#1E1B4B",
        accentColor: "#818CF8",
        backgroundColor: "#0F172A",
        textColor: "#F8FAFC",
        fontFamily: "sans",
        handle,
      },
      accounts: body.accounts || [
        {
          id: generateId("acc"),
          platform: "instagram",
          username: handle,
          accountName: `${body.name.trim()} Instagram`,
          connected: true,
          mode: "simulation",
        },
        {
          id: generateId("acc"),
          platform: "tiktok",
          username: handle,
          accountName: `${body.name.trim()} TikTok`,
          connected: true,
          mode: "simulation",
        },
        {
          id: generateId("acc"),
          platform: "facebook",
          username: body.name.trim(),
          accountName: `Página ${body.name.trim()}`,
          connected: true,
          mode: "simulation",
        },
      ],
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json({ error: "Falha ao criar cliente." }, { status: 500 });
  }
}
