"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addVideo } from "@/actions/video";
import { BilibiliPlayer } from "@/components/bilibili-player";
import { extractBvid } from "@/lib/bvid";
import { PlusCircle } from "lucide-react";

export function AddVideoDialog({
  topicId,
  topicSlug,
}: {
  topicId: string;
  topicSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  function closeDialog() {
    setOpen(false);
    setBvid("");
    setInfo(null);
    setError(null);
    setAlertMessage(null);
  }

  async function handleFetch() {
    const id = extractBvid(bvid);
    if (!id) {
      setError("请输入有效的 BV 号或 B站视频链接");
      return;
    }
    setFetching(true);
    setError(null);
    setInfo(null);
    const res = await fetch("/api/bilibili/video-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bvid: id }),
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
      setAlertMessage(res.error);
      return;
    }
    closeDialog();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
      <DialogTrigger asChild>
        <Button className="bg-bili-pink text-white hover:bg-bili-pink/90">
          <PlusCircle className="mr-2 size-4" />
          添加视频
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加视频</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-bvid">BV 号或视频链接</Label>
            <div className="flex gap-2">
              <Input
                id="add-bvid"
                placeholder="BV1xx... 或粘贴 B站链接"
                value={bvid}
                onChange={(e) => setBvid(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleFetch())
                }
              />
              <Button
                type="button"
                onClick={handleFetch}
                disabled={fetching}
              >
                {fetching ? "获取中…" : "获取"}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {info ? (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="font-medium line-clamp-2 text-sm">{info.title}</p>
              {info.up_name && (
                <p className="text-muted-foreground text-xs">UP: {info.up_name}</p>
              )}
              <div className="overflow-hidden rounded border">
                <BilibiliPlayer bvid={info.bvid} />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeDialog}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "添加中…" : "确定"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>

      <Dialog open={!!alertMessage} onOpenChange={(v) => !v && setAlertMessage(null)}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>提示</DialogTitle>
          </DialogHeader>
          <p className="py-2">{alertMessage}</p>
          <div className="flex justify-end">
            <Button onClick={() => setAlertMessage(null)}>确定</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
