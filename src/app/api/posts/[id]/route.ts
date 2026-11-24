import { NextResponse } from "next/server";
import { deletePost, updatePost } from "@/lib/db";
import type { ScheduledPost } from "@/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<Omit<ScheduledPost, "id" | "createdAt">>;
    const updated = await updatePost(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Postagem não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("PATCH /api/posts/[id] error:", error);
    return NextResponse.json({ error: "Falha ao atualizar postagem." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await deletePost(id);
    if (!deleted) {
      return NextResponse.json({ error: "Postagem não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json({ error: "Falha ao excluir postagem." }, { status: 500 });
  }
}
