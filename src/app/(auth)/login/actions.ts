"use server";

import { getCurrentProfile, isAdminProfile } from "@/services/auth";
import { createClient } from "@/services/supabase/server";

export async function verifyAndPromoteAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await getCurrentProfile();
    if (profile && isAdminProfile(profile)) {
      return { success: true };
    }

    // If the authenticated user is not an admin, sign them out on the server
    // to clear the session cookies and deny access.
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: false, error: "not-admin" };
  } catch (err: any) {
    console.error("verifyAndPromoteAdmin error:", err);
    return { success: false, error: err.message || "Verification failed" };
  }
}
