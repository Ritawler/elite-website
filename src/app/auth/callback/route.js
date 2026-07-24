import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  if (oauthError) {
    console.error("[auth/callback] Google/Supabase returned an error:", oauthError);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    console.error("[auth/callback] No `code` query param on callback URL:", request.url);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("no_code")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
