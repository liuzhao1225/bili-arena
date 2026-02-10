import { createClient } from "@/lib/supabase/server";
import { TopicCard } from "@/components/topic-card";
import { videoRank } from "@/lib/db-types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("created_at", { ascending: false });

  const topicIds = topics?.map((t) => t.id) ?? [];
  const firstCoverByTopicId: Record<string, string | null> = {};

  if (topicIds.length > 0) {
    const { data: videos } = await supabase
      .from("videos")
      .select("topic_id, cover, trueskill_mu, trueskill_sigma")
      .in("topic_id", topicIds)
      .eq("status", "active");
    const withRank = (videos ?? []).map((v) => ({
      ...v,
      rank: videoRank(v as { trueskill_mu: number; trueskill_sigma: number }),
    }));
    withRank.sort((a, b) => b.rank - a.rank);
    for (const v of withRank) {
      if (v.cover && firstCoverByTopicId[v.topic_id] == null) {
        firstCoverByTopicId[v.topic_id] = v.cover;
      }
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">专题</h1>
      {!topics?.length ? (
        <p className="text-muted-foreground">暂无专题，管理员可在后台创建。</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              coverUrl={firstCoverByTopicId[t.id] ?? t.cover_image}
            />
          ))}
        </div>
      )}
    </div>
  );
}
