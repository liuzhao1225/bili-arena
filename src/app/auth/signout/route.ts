import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/url";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", getOrigin(req)), { status: 302 });
}
