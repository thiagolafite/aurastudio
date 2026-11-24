import { getClientById, getPostById, listDueScheduledPosts, updatePost } from "@/lib/db";
import { publishToFacebook, publishToInstagram } from "@/lib/publishers/meta";
import { publishToTikTok } from "@/lib/publishers/tiktok";
import type { PublishLogEntry, ScheduledPost } from "@/types";

export interface PublishExecutionResult {
  postId: string;
  title: string;
  status: "published" | "failed";
  logs: PublishLogEntry[];
}

export async function publishSinglePost(postId: string): Promise<PublishExecutionResult | null> {
  const post = await getPostById(postId);
  if (!post) return null;

  const client = await getClientById(post.clientId);
  if (!client) {
    const failLog: PublishLogEntry = {
      platform: post.platforms[0] ?? "instagram",
      status: "failed",
      mode: "simulation",
      message: "Cliente associado à postagem não foi encontrado.",
      timestamp: new Date().toISOString(),
    };
    await updatePost(post.id, { status: "failed", publishLogs: [failLog] });
    return { postId: post.id, title: post.title, status: "failed", logs: [failLog] };
  }

  await updatePost(post.id, { status: "publishing" });

  const logs: PublishLogEntry[] = [];

  for (const platform of post.platforms) {
    const account = client.accounts.find((a) => a.platform === platform);
    if (!account || !account.connected) {
      logs.push({
        platform,
        status: "failed",
        mode: "simulation",
        message: `Conta de ${platform} não está conectada para ${client.name}. Conecte em Contas & APIs.`,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    if (platform === "instagram") {
      logs.push(await publishToInstagram(post, account));
    } else if (platform === "facebook") {
      logs.push(await publishToFacebook(post, account));
    } else if (platform === "tiktok") {
      logs.push(await publishToTikTok(post, account));
    }
  }

  const anySuccess = logs.some((l) => l.status === "published");
  const allSuccess = logs.length > 0 && logs.every((l) => l.status === "published");
  const finalStatus: ScheduledPost["status"] = allSuccess
    ? "published"
    : anySuccess
      ? "published"
      : "failed";

  await updatePost(post.id, {
    status: finalStatus,
    publishLogs: logs,
  });

  return {
    postId: post.id,
    title: post.title,
    status: finalStatus === "published" ? "published" : "failed",
    logs,
  };
}

export async function processDueScheduledPosts(): Promise<PublishExecutionResult[]> {
  const duePosts = await listDueScheduledPosts();
  const results: PublishExecutionResult[] = [];

  for (const post of duePosts) {
    const res = await publishSinglePost(post.id);
    if (res) results.push(res);
  }

  return results;
}
