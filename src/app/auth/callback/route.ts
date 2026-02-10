import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/url";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const redirectTo = nextParam && nextParam.startsWith("/") ? nextParam : "/";
  const origin = getOrigin(request);

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=callback", origin));
  }

  return NextResponse.redirect(new URL(redirectTo, origin));
}
