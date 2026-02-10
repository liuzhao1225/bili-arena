import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/url";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";
  const origin = getOrigin(request);

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    return NextResponse.redirect(new URL("/login?error=verify", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
