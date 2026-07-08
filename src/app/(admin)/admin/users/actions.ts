"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/services/auth";
import { createServiceClient } from "@/services/supabase/server";

export async function updateUserRole(
  userId: string,
  newRole: "admin" | "customer"
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAdminProfile();

  if (admin.id === userId) {
    return { error: "You cannot change your own role." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
