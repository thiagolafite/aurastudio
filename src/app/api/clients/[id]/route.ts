import { NextResponse } from "next/server";
import { deleteClient, updateClient } from "@/lib/db";
import type { ClientWorkspace } from "@/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<Omit<ClientWorkspace, "id" | "createdAt">>;
    const updated = await updateClient(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("PATCH /api/clients/[id] error:", error);
    return NextResponse.json({ error: "Falha ao atualizar cliente." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteClient(id);
    if (!deleted) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json({ error: "Falha ao remover cliente." }, { status: 500 });
  }
}
