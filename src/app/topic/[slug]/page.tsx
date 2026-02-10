import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RankingTable } from "@/components/ranking-table";
import { AddVideoDialog } from "@/components/add-video-dialog";
import { Swords } from "lucide-react";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const { data: topic, error } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !topic) notFound();

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("topic_id", topic.id)
    .eq("status", "active");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{topic.name}</h1>
          {topic.description && (
            <p className="text-muted-foreground mt-1">{topic.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="default">
            <Link href={`/topic/${slug}/pk`}>
              <Swords className="mr-2 size-4" />
              PK 投票
            </Link>
          </Button>
          <AddVideoDialog topicId={topic.id} topicSlug={slug} />
        </div>
      </div>

      {!videos?.length ? (
        <p className="text-muted-foreground">暂无视频，去添加或参与 PK 吧。</p>
      ) : (
        <RankingTable videos={videos} topicSlug={slug} />
      )}
    </div>
  );
}
