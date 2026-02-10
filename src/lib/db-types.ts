export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Topic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  created_by: string | null;
  created_at: string;
};

export type Video = {
  id: string;
  bvid: string;
  title: string;
  cover: string | null;
  up_name: string | null;
  up_mid: number | null;
  duration: number | null;
  topic_id: string;
  added_by: string | null;
  status: "active" | "deleted";
  trueskill_mu: number;
  trueskill_sigma: number;
  match_count: number;
  win_count?: number;
  loss_count?: number;
  draw_count?: number;
  created_at: string;
};

/** 总对局数 N，X胜 Y负 Z平 */
export function matchRecordLabel(v: { match_count: number; win_count?: number; loss_count?: number; draw_count?: number }): string {
  const w = v.win_count ?? 0;
  const l = v.loss_count ?? 0;
  const d = v.draw_count ?? 0;
  const n = v.match_count ?? w + l + d;
  return `总对局数 ${n}，${w}胜 ${l}负 ${d}平`;
}

export function videoRank(v: Video): number {
  return v.trueskill_mu - 3 * v.trueskill_sigma;
}
