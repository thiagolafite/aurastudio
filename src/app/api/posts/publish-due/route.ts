import { NextResponse } from "next/server";
import { processDueScheduledPosts, publishSinglePost } from "@/lib/publishers";

export async function POST(request: Request) {
  try {
    let postId: string | undefined;
    try {
      const body = (await request.json()) as { postId?: string };
      postId = body?.postId;
    } catch {
      // Optional JSON body
    }

    if (postId) {
      const result = await publishSinglePost(postId);
      if (!result) {
        return NextResponse.json({ error: "Postagem não encontrada." }, { status: 404 });
      }
      return NextResponse.json({ results: [result] });
    }

    const results = await processDueScheduledPosts();
    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("POST /api/posts/publish-due error:", error);
    return NextResponse.json(
      { error: "Erro ao executar o motor de publicação." },
      { status: 500 }
    );
  }
}
