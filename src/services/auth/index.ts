import { createClient as createServerSupabase, createServiceClient } from "@/services/supabase/server";
import type { Profile, UserRole } from "@/types";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function roleForEmail(email: string): UserRole {
  return adminEmails().includes(email.toLowerCase()) ? "admin" : "customer";
}

export async function getCurrentProfile({ create = true } = {}) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) return null;

    const service = createServiceClient();
    const { data: existing, error: lookupError } = await service
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .maybeSingle();

    if (lookupError) throw new Error(lookupError.message);

    const email = supabaseUser.email ?? "";
    const expectedRole = roleForEmail(email);

    if (existing) {
      // ADMIN_EMAILS can bootstrap-promote a customer → admin on login,
      // but never auto-demote: DB role is authoritative for downgrades.
      if (existing.role === "customer" && expectedRole === "admin") {
        const { data: updated } = await service
          .from("profiles")
          .update({ role: "admin" })
          .eq("id", supabaseUser.id)
          .select("*")
          .single();
        if (updated) return updated as Profile;
      }
      return existing as Profile;
    }

    if (!create) return null;
    const fullName = supabaseUser.user_metadata?.full_name || null;

    const { data: profile, error: insertError } = await service
      .from("profiles")
      .insert({
        id: supabaseUser.id,
        email,
        full_name: fullName,
        role: expectedRole,
      })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);
    return profile as Profile;
  } catch (err) {
    const isDynamicError = 
      err && 
      (typeof err === "object" || typeof err === "function") &&
      (("message" in err && typeof (err as any).message === "string" && (err as any).message.includes("Dynamic server usage")) ||
       ("digest" in err && (err as any).digest === "DYNAMIC_SERVER_USAGE") ||
       ((err as any).constructor && (err as any).constructor.name === "DynamicServerError"));

    if (isDynamicError) {
      throw err;
    }
    console.error("Supabase user session check error:", err);
  }

  return null;
}

export async function requireCurrentProfile() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  return profile;
}

export function isAdminProfile(profile: Pick<Profile, "role" | "email"> | null | undefined) {
  return profile?.role === "admin";
}

export async function requireAdminProfile() {
  const profile = await requireCurrentProfile();
  if (!isAdminProfile(profile)) throw new Error("Forbidden");
  return profile;
}
