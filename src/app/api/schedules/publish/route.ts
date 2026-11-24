import { handleSchedule } from "@vercel/schedules";
import { processDueScheduledPosts } from "@/lib/publishers";

/**
 * Private Vercel Schedule function triggered every 5 minutes (see vercel.json).
 * Finds all scheduled posts whose scheduledAt <= now and publishes them to
 * Instagram, TikTok, and Facebook automatically.
 */
export const POST = handleSchedule(async (metadata) => {
  console.log(
    `[Vercel Schedule] ${metadata.name} execution=${metadata.executionId} at=${metadata.scheduledAt.toISOString()}`
  );
  const results = await processDueScheduledPosts();
  console.log(`[Vercel Schedule] Processed ${results.length} due post(s).`);
});
