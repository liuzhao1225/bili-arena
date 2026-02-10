"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const EMAIL_DOMAIN = "biliarena.app";

function toEmail(username: string) {
  return `${username}@${EMAIL_DOMAIN}`;
}

// 强密码校验：>=8位，含大写、小写、数字、特殊字符
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "密码至少 8 位";
  if (!/[A-Z]/.test(pw)) return "密码需包含大写字母";
  if (!/[a-z]/.test(pw)) return "密码需包含小写字母";
  if (!/[0-9]/.test(pw)) return "密码需包含数字";
  if (!/[^A-Za-z0-9]/.test(pw)) return "密码需包含特殊字符";
  return null;
}

function validateUsername(name: string): string | null {
  if (name.length < 2 || name.length > 20) return "用户名长度 2-20 位";
  if (!/^[a-zA-Z0-9_\u4e00-\u9fff]+$/.test(name))
    return "用户名只能包含字母、数字、下划线、中文";
  return null;
}

export async function signupWithUsername(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  const nameErr = validateUsername(username);
  if (nameErr) return { error: nameErr };

  const pwErr = validatePassword(password);
  if (pwErr) return { error: pwErr };

  if (password !== confirm) return { error: "两次密码不一致" };

  // 检查用户名唯一
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return { error: "用户名已被占用" };

  // 用 admin API 创建用户（自动确认邮箱，免验证）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createAdminClient(url, serviceKey);

  const { error } = await admin.auth.admin.createUser({
    email: toEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, full_name: username },
  });

  if (error) {
    if (error.message.includes("already been registered"))
      return { error: "用户名已被占用" };
    return { error: error.message };
  }

  // 注册成功，自动登录
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: toEmail(username),
    password,
  });

  if (signInError) return { error: "注册成功，但自动登录失败，请手动登录" };

  return { error: undefined };
}
