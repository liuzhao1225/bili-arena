"use server";

import { createClient } from "@/lib/supabase/server";
import { updateRatings1v1, updateRatings1v1Draw } from "@/lib/trueskill";
import { revalidatePath } from "next/cache";

export async function getPair(topicSlug: string) {
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", topicSlug)
    .single();
  if (!topic) return { error: "专题不存在", pair: null };

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("topic_id", topic.id)
    .eq("status", "active");
  if (!videos || videos.length < 2)
    return { error: "视频不足 2 个", pair: { topicId: topic.id, left: null, right: null } };

  // 信息最大化配对：
  // 1. 按 sigma 降序，优先选不确定性最高的视频作为"主角"
  // 2. 在剩余视频中，找 mu 最接近的作为对手（实力接近 → 结果最难预测 → 信息增益最大）
  // 3. 加一点随机性避免总是同样的配对
  const sorted = [...videos].sort((a, b) => b.trueskill_sigma - a.trueskill_sigma);
  // 从 sigma 最高的前几个中随机选一个作为主角
  const topN = Math.min(5, sorted.length);
  const a = sorted[Math.floor(Math.random() * topN)];
  // 在剩余视频中，按 |mu差| 排序，从最接近的前几个中随机选
  const rest = sorted.filter((v) => v.id !== a.id);
  rest.sort((x, y) => Math.abs(x.trueskill_mu - a.trueskill_mu) - Math.abs(y.trueskill_mu - a.trueskill_mu));
  const matchN = Math.min(3, rest.length);
  const b = rest[Math.floor(Math.random() * matchN)];

  // 随机决定左右位置
  const [left, right] = Math.random() < 0.5 ? [a, b] : [b, a];
  return {
    error: null,
    pair: { topicId: topic.id, left, right },
  };
}

export async function submitVote(
  topicId: string,
  winnerId: string,
  loserId: string,
  isDraw = false
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "请先登录" };

  const { data: winner } = await supabase
    .from("videos")
    .select("trueskill_mu, trueskill_sigma, match_count, win_count, loss_count, draw_count")
    .eq("id", winnerId)
    .single();
  const { data: loser } = await supabase
    .from("videos")
    .select("trueskill_mu, trueskill_sigma, match_count, win_count, loss_count, draw_count")
    .eq("id", loserId)
    .single();
  if (!winner || !loser) return { error: "视频不存在" };

  const ratings = isDraw
    ? updateRatings1v1Draw(
        winner.trueskill_mu, winner.trueskill_sigma,
        loser.trueskill_mu, loser.trueskill_sigma
      )
    : updateRatings1v1(
        winner.trueskill_mu, winner.trueskill_sigma,
        loser.trueskill_mu, loser.trueskill_sigma
      );
  const [wMu, wSigma] = ratings[0];
  const [lMu, lSigma] = ratings[1];

  const wWin = (winner.win_count ?? 0) + (isDraw ? 0 : 1);
  const wLoss = winner.loss_count ?? 0;
  const wDraw = (winner.draw_count ?? 0) + (isDraw ? 1 : 0);
  const lWin = loser.win_count ?? 0;
  const lLoss = (loser.loss_count ?? 0) + (isDraw ? 0 : 1);
  const lDraw = (loser.draw_count ?? 0) + (isDraw ? 1 : 0);
  const wCount = wWin + wLoss + wDraw;
  const lCount = lWin + lLoss + lDraw;

  const { error: rpcErr } = await supabase.rpc("apply_vote_result", {
    p_topic_id: topicId,
    p_winner_id: winnerId,
    p_loser_id: loserId,
    p_voter_id: user.id,
    p_is_draw: isDraw,
    p_winner_mu: wMu,
    p_winner_sigma: wSigma,
    p_winner_match_count: wCount,
    p_winner_win_count: wWin,
    p_winner_loss_count: wLoss,
    p_winner_draw_count: wDraw,
    p_loser_mu: lMu,
    p_loser_sigma: lSigma,
    p_loser_match_count: lCount,
    p_loser_win_count: lWin,
    p_loser_loss_count: lLoss,
    p_loser_draw_count: lDraw,
  });

  if (rpcErr) return { error: rpcErr.message };

  revalidatePath("/topic/[slug]", "page");
  return { error: null };
}

export async function getVideoScores(videoIds: [string, string]) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("id, trueskill_mu, trueskill_sigma, match_count, win_count, loss_count, draw_count")
    .in("id", videoIds);
  const rank = (v: { trueskill_mu: number; trueskill_sigma: number }) =>
    v.trueskill_mu - 3 * v.trueskill_sigma;
  const left = data?.find((r) => r.id === videoIds[0]);
  const right = data?.find((r) => r.id === videoIds[1]);
  const toRecord = (
    v: { trueskill_mu: number; trueskill_sigma: number; match_count: number; win_count?: number; loss_count?: number; draw_count?: number } | undefined
  ) =>
    v
      ? {
          score: rank(v),
          matchCount: v.match_count,
          winCount: v.win_count ?? 0,
          lossCount: v.loss_count ?? 0,
          drawCount: v.draw_count ?? 0,
        }
      : null;
  return { left: toRecord(left ?? undefined), right: toRecord(right ?? undefined) };
}
