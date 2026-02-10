"use server";

import { createClient } from "@/lib/supabase/server";

export type CommentRow = {
  id: string;
  video_id: string;
  user_id: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_name?: string | null;
  likes: number;
  dislikes: number;
  my_reaction?: "like" | "dislike" | null;
};

export async function getCommentsForVideos(
  videoIds: string[],
  currentUserId?: string | null
) {
  if (videoIds.length === 0) return {};
  const supabase = await createClient();

  // 获取评论
  const { data: comments } = await supabase
    .from("comments")
    .select("id, video_id, user_id, parent_id, content, created_at")
    .in("video_id", videoIds)
    .order("created_at", { ascending: true });

  if (!comments?.length) {
    const byVideo: Record<string, CommentRow[]> = {};
    for (const id of videoIds) byVideo[id] = [];
    return byVideo;
  }

  // 获取用户名
  const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean))] as string[];
  let nameMap: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    nameMap = Object.fromEntries((data ?? []).map((p) => [p.id, p.display_name]));
  }

  // 获取 reactions 汇总
  const commentIds = comments.map((c) => c.id);
  const { data: reactions } = await supabase
    .from("comment_reactions")
    .select("comment_id, reaction_type")
    .in("comment_id", commentIds);

  const likesMap: Record<string, number> = {};
  const dislikesMap: Record<string, number> = {};
  for (const r of reactions ?? []) {
    if (r.reaction_type === "like") likesMap[r.comment_id] = (likesMap[r.comment_id] ?? 0) + 1;
    else dislikesMap[r.comment_id] = (dislikesMap[r.comment_id] ?? 0) + 1;
  }

  // 当前用户的 reactions
  let myReactions: Record<string, "like" | "dislike"> = {};
  if (currentUserId && commentIds.length > 0) {
    const { data: mine } = await supabase
      .from("comment_reactions")
      .select("comment_id, reaction_type")
      .eq("user_id", currentUserId)
      .in("comment_id", commentIds);
    for (const r of mine ?? []) {
      myReactions[r.comment_id] = r.reaction_type as "like" | "dislike";
    }
  }

  const byVideo: Record<string, CommentRow[]> = {};
  for (const id of videoIds) byVideo[id] = [];
  for (const c of comments) {
    byVideo[c.video_id].push({
      ...c,
      author_name: c.user_id ? nameMap[c.user_id] ?? null : null,
      likes: likesMap[c.id] ?? 0,
      dislikes: dislikesMap[c.id] ?? 0,
      my_reaction: myReactions[c.id] ?? null,
    });
  }
  return byVideo;
}

export async function addComment(
  videoId: string,
  content: string,
  parentId?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "请先登录" };
  const text = content.trim();
  if (!text) return { error: "评论不能为空" };

  const { error } = await supabase.from("comments").insert({
    video_id: videoId,
    user_id: user.id,
    content: text,
    parent_id: parentId ?? null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function toggleReaction(
  commentId: string,
  reactionType: "like" | "dislike"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "请先登录" };

  // 查看是否已有 reaction
  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("reaction_type")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      // 取消
      await supabase
        .from("comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
    } else {
      // 切换
      await supabase
        .from("comment_reactions")
        .update({ reaction_type: reactionType })
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
    }
  } else {
    // 新增
    await supabase.from("comment_reactions").insert({
      comment_id: commentId,
      user_id: user.id,
      reaction_type: reactionType,
    });
  }

  return { error: null };
}
