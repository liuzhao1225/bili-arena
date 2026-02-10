import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/logo";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? await supabase
        .from("profiles")
        .select("display_name, avatar_url, is_admin")
        .eq("id", user.id)
        .single()
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 font-bold">
          <Logo className="size-7" />
          <span className="text-[#00A1D6]">Bili</span>
          <span className="-ml-1 text-[#FB7299]">Arena</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarImage src={profile?.data?.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(profile?.data?.display_name ?? user.email ?? "?").slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profile?.data?.is_admin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Settings className="mr-2 size-4" />
                      管理后台
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="flex w-full items-center">
                      <LogOut className="mr-2 size-4" />
                      退出
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">登录</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
