import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(next && next.startsWith("/") ? next : "/");
  }

  const errorMsg =
    error === "no_code"
      ? "缺少授权码"
      : error === "callback"
        ? "登录回调失败"
        : error === "invalid_link"
          ? "链接无效"
          : error === "verify"
            ? "验证失败"
            : null;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">登录</h1>
      {errorMsg && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {errorMsg}
        </p>
      )}
      <LoginForm redirectTo={next ?? "/"} />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="underline hover:text-foreground">
          返回首页
        </Link>
      </p>
    </div>
  );
}
