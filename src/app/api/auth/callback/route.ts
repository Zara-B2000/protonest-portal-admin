import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { getCurrentProfile, isAdminProfile } from "@/services/auth";

/** Build a reliable base URL that works on Vercel production, previews, and localhost */
function getBaseUrl(request: Request): string {
  // 1. Try to extract origin directly from the request URL
  try {
    const origin = new URL(request.url).origin;
    if (origin && !origin.startsWith("null")) {
      return origin;
    }
  } catch {}

  // 2. On Vercel, x-forwarded-host reflects the actual domain being accessed
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 3. Fallback to host header
  const host = request.headers.get("host");
  if (host) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${host}`;
  }

  // 4. Fallback to explicit env vars if headers are missing
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  return "http://localhost:3000";
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
      // getCurrentProfile() automatically handles bootstrap-promoting the
      // user to admin if their email is listed in ADMIN_EMAILS.
      const profile = await getCurrentProfile();
      if (profile && isAdminProfile(profile)) {
        return NextResponse.redirect(`${baseUrl}/admin/dashboard`);
      }
      
      await supabase.auth.signOut();
      return NextResponse.redirect(`${baseUrl}/login?error=not-admin`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth-callback-failed`);
}
