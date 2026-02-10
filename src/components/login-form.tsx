"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signupWithUsername } from "@/app/login/actions";

const EMAIL_DOMAIN = "biliarena.local";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // 账号密码 — 登录 / 注册切换
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // 注册 server action
  const [signupState, signupAction, signupPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await signupWithUsername(_prev, formData);
      if (!result.error) {
        router.push(redirectTo);
        router.refresh();
      }
      return result;
    },
    null
  );

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo.startsWith("/")
          ? `${origin}/auth/confirm?next=${encodeURIComponent(redirectTo)}`
          : undefined,
      },
    });
    setLoading(false);
    if (error) return;
    setSent(true);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: `${username.trim()}@${EMAIL_DOMAIN}`,
      password,
    });
    setPwLoading(false);
    if (error) {
      setPwError("用户名或密码错误");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        已向 <strong>{email}</strong> 发送登录链接，请查收邮件并点击链接完成登录。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">账号密码</TabsTrigger>
          <TabsTrigger value="magic">魔法链接</TabsTrigger>
        </TabsList>

        {/* ---- 账号密码 Tab ---- */}
        <TabsContent value="password" className="space-y-4">
          {isRegister ? (
            <form action={signupAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="reg-username">用户名</Label>
                <Input
                  id="reg-username"
                  name="username"
                  placeholder="2-20 位，字母/数字/下划线/中文"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">密码</Label>
                <Input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="至少 8 位，含大小写、数字、特殊字符"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">确认密码</Label>
                <Input
                  id="reg-confirm"
                  name="confirm"
                  type="password"
                  placeholder="再次输入密码"
                  required
                />
              </div>
              {signupState?.error && (
                <p className="text-sm text-destructive">{signupState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={signupPending}>
                {signupPending ? "注册中…" : "注册"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                已有账号？
                <button
                  type="button"
                  className="ml-1 underline hover:text-foreground"
                  onClick={() => setIsRegister(false)}
                >
                  去登录
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="login-username">用户名</Label>
                <Input
                  id="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">密码</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                />
              </div>
              {pwError && (
                <p className="text-sm text-destructive">{pwError}</p>
              )}
              <Button type="submit" className="w-full" disabled={pwLoading}>
                {pwLoading ? "登录中…" : "登录"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                没有账号？
                <button
                  type="button"
                  className="ml-1 underline hover:text-foreground"
                  onClick={() => setIsRegister(true)}
                >
                  去注册
                </button>
              </p>
            </form>
          )}
        </TabsContent>

        {/* ---- 魔法链接 Tab ---- */}
        <TabsContent value="magic" className="space-y-4">
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "发送中…" : "发送魔法链接"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* ---- 分割线 + Google ---- */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
          <span className="bg-background px-2">或</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
      >
        使用 Google 登录
      </Button>
    </div>
  );
}
