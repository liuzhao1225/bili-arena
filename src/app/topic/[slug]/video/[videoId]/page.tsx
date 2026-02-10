import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { videoRank, matchRecordLabel } from "@/lib/db-types";
import { BilibiliPlayer } from "@/components/bilibili-player";
import { VideoComments } from "@/components/video-comments";
import { getCommentsForVideos } from "@/actions/comment";
import { ArrowLeft } from "lucide-react";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ slug: string; videoId: string }>;
}) {
  const { slug: rawSlug, videoId } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .maybeSingle();
  if (!video) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const comments = await getCommentsForVideos([videoId], user?.id);
  const score = videoRank(video);

  return (
    <div className="space-y-6">
      <Link
        href={`/topic/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        返回排行榜
      </Link>

      <BilibiliPlayer bvid={video.bvid} />

      <div className="space-y-2">
        <h1 className="text-xl font-bold">{video.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {video.up_name && <span>UP主：{video.up_name}</span>}
          <span>得分：{score.toFixed(1)}</span>
          <span>{matchRecordLabel(video)}</span>
          <a
            href={`https://www.bilibili.com/video/${video.bvid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a1d6] hover:underline"
          >
            在B站打开
          </a>
        </div>
      </div>

      <VideoComments videoId={videoId} initialComments={comments[videoId] ?? []} />
    </div>
  );
}
