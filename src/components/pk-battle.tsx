"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BilibiliPlayer } from "@/components/bilibili-player";
import { VideoComments } from "@/components/video-comments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPair, submitVote, getVideoScores } from "@/actions/vote";
import { getCommentsForVideos, type CommentRow } from "@/actions/comment";
import type { Video } from "@/lib/db-types";
import { matchRecordLabel } from "@/lib/db-types";

type Pair = { topicId: string; left: Video; right: Video };

type ResultState = {
  leftScore: number;
  rightScore: number;
  leftMatchCount: number;
  rightMatchCount: number;
  leftWinCount: number;
  leftLossCount: number;
  leftDrawCount: number;
  rightWinCount: number;
  rightLossCount: number;
  rightDrawCount: number;
  commentsLeft: CommentRow[];
  commentsRight: CommentRow[];
};

export function PkBattle({ topicSlug }: { topicSlug: string }) {
  const [pair, setPair] = useState<Pair | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [confirmChoice, setConfirmChoice] = useState<
    { winnerId: string; loserId: string; isDraw: boolean } | null
  >(null);

  const loadPair = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await getPair(topicSlug);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setPair(null);
      return;
    }
    if (res.pair?.left && res.pair?.right) setPair(res.pair as Pair);
    else setPair(null);
  }, [topicSlug]);

  useEffect(() => {
    loadPair();
  }, [loadPair]);

  function openConfirm(winnerId: string, loserId: string, isDraw: boolean) {
    setConfirmChoice({ winnerId, loserId, isDraw });
  }

  async function submitConfirmed() {
    if (!pair || !confirmChoice) return;
    setVoting(true);
    setError(null);
    setConfirmChoice(null);
    const { winnerId, loserId, isDraw } = confirmChoice;
    const res = await submitVote(pair.topicId, winnerId, loserId, isDraw);
    setVoting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const scoresRes = await getVideoScores([pair.left.id, pair.right.id]);
    const commentsRes = await getCommentsForVideos([pair.left.id, pair.right.id]);
    setResult({
      leftScore: scoresRes.left?.score ?? 0,
      rightScore: scoresRes.right?.score ?? 0,
      leftMatchCount: scoresRes.left?.matchCount ?? 0,
      rightMatchCount: scoresRes.right?.matchCount ?? 0,
      leftWinCount: scoresRes.left?.winCount ?? 0,
      leftLossCount: scoresRes.left?.lossCount ?? 0,
      leftDrawCount: scoresRes.left?.drawCount ?? 0,
      rightWinCount: scoresRes.right?.winCount ?? 0,
      rightLossCount: scoresRes.right?.lossCount ?? 0,
      rightDrawCount: scoresRes.right?.drawCount ?? 0,
      commentsLeft: commentsRes[pair.left.id] ?? [],
      commentsRight: commentsRes[pair.right.id] ?? [],
    });
  }

  async function handleNext() {
    setResult(null);
    loadPair();
  }

  if (loading && !pair) return <p className="text-muted-foreground">加载中…</p>;
  if (error && !pair) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }
  if (!pair) return <p className="text-muted-foreground">暂无可用对决</p>;

  const { left, right } = pair;

  const confirmMessage = confirmChoice && (() => {
    if (confirmChoice.isDraw) return "旗鼓相当";
    if (confirmChoice.winnerId === left.id) return `左边的「${left.title}」`;
    return `右边的「${right.title}」`;
  })();

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* 两个视频始终显示 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="line-clamp-2 font-medium">{left.title}</p>
          <BilibiliPlayer bvid={left.bvid} />
        </div>
        <div className="space-y-2">
          <p className="line-clamp-2 font-medium">{right.title}</p>
          <BilibiliPlayer bvid={right.bvid} />
        </div>
      </div>

      {/* 按钮区 */}
      {result ? (
        <Button className="w-full bg-[#fb7299] text-white hover:bg-[#fb7299]/90" onClick={handleNext}>
          下一组
        </Button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" disabled={voting} onClick={() => openConfirm(left.id, right.id, false)}>
            {voting ? "提交中…" : "选这个"}
          </Button>
          <Button variant="outline" disabled={voting} onClick={() => openConfirm(left.id, right.id, true)}>
            {voting ? "提交中…" : "旗鼓相当"}
          </Button>
          <Button variant="outline" disabled={voting} onClick={() => openConfirm(right.id, left.id, false)}>
            {voting ? "提交中…" : "选这个"}
          </Button>
        </div>
      )}

      {/* 提交后：得分 + 评论区 */}
      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="line-clamp-2 font-medium">{left.title}</p>
              <p className="mt-1 text-2xl font-mono tabular-nums">得分 {result.leftScore.toFixed(1)}</p>
              <p className="text-muted-foreground text-sm">
                {matchRecordLabel({
                  match_count: result.leftMatchCount,
                  win_count: result.leftWinCount,
                  loss_count: result.leftLossCount,
                  draw_count: result.leftDrawCount,
                })}
              </p>
            </div>
            <VideoComments videoId={left.id} initialComments={result.commentsLeft} compact />
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="line-clamp-2 font-medium">{right.title}</p>
              <p className="mt-1 text-2xl font-mono tabular-nums">得分 {result.rightScore.toFixed(1)}</p>
              <p className="text-muted-foreground text-sm">
                {matchRecordLabel({
                  match_count: result.rightMatchCount,
                  win_count: result.rightWinCount,
                  loss_count: result.rightLossCount,
                  draw_count: result.rightDrawCount,
                })}
              </p>
            </div>
            <VideoComments videoId={right.id} initialComments={result.commentsRight} compact />
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      <Dialog open={!!confirmChoice} onOpenChange={(open) => !open && setConfirmChoice(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认选择</DialogTitle>
          </DialogHeader>
          <p className="py-2">
            你选择了：<strong>{confirmMessage}</strong>
          </p>
          <p className="text-muted-foreground text-sm">选择后将影响双方得分，请确认。</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmChoice(null)}>
              取消
            </Button>
            <Button onClick={submitConfirmed} disabled={voting}>
              {voting ? "提交中…" : "确认提交"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
