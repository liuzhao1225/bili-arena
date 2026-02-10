"use server";

import { createClient } from "@/lib/supabase/server";

type VideoInput = {
  bvid: string;
  title: string;
  cover?: string | null;
  up_name?: string | null;
  up_mid?: number | null;
  duration?: number | null;
};

export async function addVideo(
  topicId: string,
  input: VideoInput
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "请先登录" };

  let addedBy: string | null = user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) addedBy = null;

  const { error } = await supabase.from("videos").insert({
    topic_id: topicId,
    bvid: input.bvid,
    title: input.title,
    cover: input.cover ?? null,
    up_name: input.up_name ?? null,
    up_mid: input.up_mid ?? null,
    duration: input.duration ?? null,
    added_by: addedBy,
    status: "active",
  });

  if (error) {
    if (error.code === "23505") return { error: "该视频已在本专题中" };
    if (error.code === "23503") return { error: "用户信息未就绪，请稍后再试" };
    return { error: error.message };
  }
  return { error: null };
}
