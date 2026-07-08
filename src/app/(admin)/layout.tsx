export const dynamic = "force-dynamic";

import "./admin.css";
import { createServiceClient } from "@/services/supabase/server";
import { getCurrentProfile, isAdminProfile } from "@/services/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SidebarToggle from "@/components/admin/SidebarToggle";
import TopbarActions from "@/components/admin/TopbarActions";
import SessionTimeoutWatcher from "@/components/admin/SessionTimeoutWatcher";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!isAdminProfile(profile)) redirect("/login");

  const supabase = createServiceClient();

  // ── Query counts for orders ──
  const { count: allOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: needsQuote } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "quote_pending");

  const { count: awaitingPayment } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "quote_ready");

  const { count: activeAssembly } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["payment_completed", "components_received", "in_assembly", "inspection", "ready_for_delivery"]);

  const { count: delivered } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "delivered");

  // ── Query unread messages count ──
  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)
    .neq("sender_id", profile.id);

  const sidebarCounts = {
    all: allOrders || 0,
    needsQuote: needsQuote || 0,
    awaitingPayment: awaitingPayment || 0,
    activeAssembly: activeAssembly || 0,
    delivered: delivered || 0,
    unreadMessages: unreadMessages || 0,
  };

  return (
    <div className="admin-layout-root">
      <SessionTimeoutWatcher />
      {/* Decorative gradients */}
      <div className="bg-deco"></div>
      <div className="grid-lines"></div>

      {/* Sidebar Navigation */}
      <AdminSidebar profile={profile} counts={sidebarCounts} />

      {/* Main Panel */}
      <div className="main">
        {/* Topbar Header */}
        <header className="topbar">
          <SidebarToggle />
          <div className="tb-title">Admin <span>Dashboard</span></div>
          <TopbarActions />
        </header>

        {/* Content Area */}
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
