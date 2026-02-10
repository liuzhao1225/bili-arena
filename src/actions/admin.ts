"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function claimFirstAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_first_admin");
  if (error) return { error: error.message };
  if (!data) return { error: "已有管理员，无法领取" };
  revalidatePath("/", "layout");
  return { error: null };
}

export async function setVideoDeleted(videoId: string, deleted: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "未登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return { error: "无权限" };

  const { error } = await supabase
    .from("videos")
    .update({ status: deleted ? "deleted" : "active" })
    .eq("id", videoId);
  if (error) return { error: error.message };
  revalidatePath("/topic/[slug]", "page");
  return { error: null };
}
