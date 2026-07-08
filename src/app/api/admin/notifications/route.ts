import { NextResponse } from "next/server";
import { requireAdminProfile } from "@/services/auth";
import { createServiceClient } from "@/services/supabase/server";

export async function GET() {
  try {
    await requireAdminProfile();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, event_type, channel, status, recipient, error_reason, sent_at, orders(order_number)")
    .order("sent_at", { ascending: false })
    .limit(15);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notifications: data ?? [] });
}
