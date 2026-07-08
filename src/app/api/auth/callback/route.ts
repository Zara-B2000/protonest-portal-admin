import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";

/** Build a reliable base URL that works on Vercel production, previews, and localhost */
function getBaseUrl(request: Request): string {
  // 1. Prefer explicit NEXT_PUBLIC_SITE_URL env var (set this in Vercel to your production domain)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  // 2. On Vercel, x-forwarded-host reflects the actual domain being accessed
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 3. Fallback to host header
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const baseUrl = getBaseUrl(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // This portal is admin-only. Only allow the session through if the
      // profile is an admin — otherwise sign them back out and bounce to
      // login with an explanatory message.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role === "admin") {
          return NextResponse.redirect(`${baseUrl}/admin/dashboard`);
        }
      }
      await supabase.auth.signOut();
      return NextResponse.redirect(`${baseUrl}/login?error=not-admin`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth-callback-failed`);
}
