"use server";

import { createServiceClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { error: string };

export async function updateAdminProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function clearCache(): Promise<ActionResult> {
  try {
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Cache clear failed" };
  }
}

export async function deleteAllOrders(): Promise<ActionResult> {
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return { error: error.message };
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Delete failed" };
  }
}

export async function factoryReset(): Promise<ActionResult> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Factory reset failed" };
  }
}

export async function saveSystemSettings(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("portal_settings")
      .update({
        default_line_view: formData.get("default_line_view") as string,
        dashboard_auto_refresh: formData.get("dashboard_auto_refresh") as string,
        yield_alert_threshold: Number(formData.get("yield_alert_threshold")),
        audit_logging: formData.get("audit_logging") === "true",
        traceability: formData.get("traceability") === "true",
        retention_period: formData.get("retention_period") as string,
        maintenance_mode: formData.get("maintenance_mode") === "true",
        self_registration: formData.get("self_registration") === "true",
        updated_by: user?.id ?? null,
      })
      .eq("id", 1);

    if (error) return { error: error.message };

    revalidatePath("/admin/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to save system settings" };
  }
}
