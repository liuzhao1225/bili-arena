"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addVideo } from "@/actions/video";

export function AddVideoForm({
  topicId,
  topicSlug,
}: {
  topicId: string;
  topicSlug: string;
}) {
  const router = useRouter();
  const [bvid, setBvid] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [info, setInfo] = useState<{
    bvid: string;
    title: string;
    cover: string | null;
    up_name: string | null;
    up_mid: number | null;
    duration: number | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    const raw = bvid.trim().replace(/.*(BV[\w]+).*/i, "$1");
    if (!raw.startsWith("BV")) {
      setError("请输入有效的 BV 号或 B站视频链接");
      return;
    }
    setFetching(true);
    setError(null);
    setInfo(null);
    const res = await fetch("/api/bilibili/video-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bvid: raw }),
    });
    const data = await res.json();
    setFetching(false);
    if (!res.ok) {
      setError(data.error ?? "获取失败");
      return;
    }
    setInfo(data);
  }

  async function handleSubmit() {
    if (!info) return;
    setLoading(true);
    setError(null);
    const res = await addVideo(topicId, info);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(`/topic/${topicSlug}`);
    router.refresh();
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="bvid">BV 号或视频链接</Label>
        <div className="flex gap-2">
          <Input
            id="bvid"
            placeholder="BV1xx... 或 https://www.bilibili.com/video/BV1xx..."
            value={bvid}
            onChange={(e) => setBvid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleFetch())}
          />
          <Button type="button" onClick={handleFetch} disabled={fetching}>
            {fetching ? "获取中…" : "获取信息"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {info && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex gap-3">
            {info.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.cover}
                alt=""
                className="size-24 shrink-0 rounded object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium line-clamp-2">{info.title}</p>
              {info.up_name && (
                <p className="text-muted-foreground text-sm">UP: {info.up_name}</p>
              )}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "添加中…" : "确认添加"}
          </Button>
        </div>
      )}
    </div>
  );
}
