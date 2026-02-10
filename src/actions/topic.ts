"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");
}

export async function createTopic(name: string, description: string) {
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

  const slug = slugify(name) || "topic";
  const { error } = await supabase.from("topics").insert({
    name: name.trim(),
    slug,
    description: description.trim() || null,
    created_by: user.id,
  });
  if (error) {
    if (error.code === "23505") return { error: "该专题 slug 已存在" };
    return { error: error.message };
  }
  revalidatePath("/");
  return { error: null };
}

export async function updateTopic(
  id: string,
  name: string,
  description: string
) {
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

  const slug = slugify(name) || "topic";
  const { error } = await supabase
    .from("topics")
    .update({ name: name.trim(), slug, description: description.trim() || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/topic/[slug]", "page");
  return { error: null };
}

export async function deleteTopic(id: string) {
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

  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { error: null };
}
