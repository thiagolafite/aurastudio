import { NextResponse } from "next/server";
import { saveMediaBuffer } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const stored = await saveMediaBuffer(
        Buffer.from(arrayBuffer),
        file.name,
        file.type || "image/png"
      );
      return NextResponse.json(stored);
    }

    const body = (await request.json()) as { dataUrl?: string; filename?: string };
    if (!body.dataUrl || !body.dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Data URL inválida." }, { status: 400 });
    }

    const match = body.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Formato base64 inválido." }, { status: 400 });
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const stored = await saveMediaBuffer(
      buffer,
      body.filename || "layout-export.png",
      mimeType
    );

    return NextResponse.json(stored);
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Falha ao salvar mídia." }, { status: 500 });
  }
}
