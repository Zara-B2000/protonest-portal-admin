export const dynamic = "force-dynamic";

import { createServiceClient } from "@/services/supabase/server";
import { getCurrentProfile, isAdminProfile } from "@/services/auth";
import { getPortalSettings } from "@/services/settings";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardAutoRefresh from "@/components/admin/DashboardAutoRefresh";
import { formatDate, formatLKR } from "@/utils";
import type { OrderStatus } from "@/types";
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  CheckSquare, 
  DollarSign, 
  Activity, 
  Users, 
  TrendingUp, 
  MessageSquare,
  RefreshCw
} from "lucide-react";

type OrderProfile = { id: string; full_name: string | null; email: string };
type AdminOrder = {
  id: string;
  order_number: string;
  project_name: string;
  units: number;
  status: OrderStatus;
  expected_delivery: string | null;
  created_at: string;
  profiles: OrderProfile | OrderProfile[] | null;
  quotes: { amount_lkr: number; status: string }[] | null;
  payments: { status: string }[] | null;
};

function orderCustomer(profiles: OrderProfile | OrderProfile[] | null | undefined): OrderProfile | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
}

function getAvClass(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash % 4) + 1; // av-1 to av-4
  return `av-${idx}`;
}

const STATUS_PILL_CONFIG: Record<OrderStatus, { className: string; label: string }> = {
  quote_pending:       { className: "p-pending",    label: "Quote Pending" },
  quote_ready:         { className: "p-ready",      label: "Quote Ready" },
  payment_completed:   { className: "p-assembly",   label: "Paid" },
  components_received: { className: "p-assembly",   label: "Components Recv" },
  in_assembly:         { className: "p-assembly",   label: "In Assembly" },
  inspection:          { className: "p-inspection", label: "Inspection" },
  ready_for_delivery:  { className: "p-inspection", label: "Ready for Delivery" },
  delivered:           { className: "p-delivered",  label: "Delivered" },
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!isAdminProfile(profile)) redirect("/login");

  const adminSupabase = createServiceClient();
  const searchFilter = (await searchParams).filter;
  const settings = await getPortalSettings();

  // ── Fetch orders ──
  const { data: rawOrders, error: ordersError } = await adminSupabase
    .from("orders")
    .select(`
      id, order_number, project_name, units, status,
      expected_delivery, created_at,
      profiles(id, full_name, email),
      quotes(amount_lkr, status),
      payments(status)
    `)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return (
      <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-5">
        <h1 className="text-lg font-bold mb-2">Admin Dashboard Error</h1>
        <p className="text-sm">{ordersError.message}</p>
      </div>
    );
  }

  const orders = (rawOrders ?? []) as AdminOrder[];

  // ── Query customer counts ──
  const { count: customerCount } = await adminSupabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  // ── Query unread messages count ──
  const { count: unreadMessages } = await adminSupabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)
    .neq("sender_id", profile.id);

  // ── Query live activity status history ──
  const { data: rawLogs } = await adminSupabase
    .from("status_history")
    .select(`
      id, old_status, new_status, note, changed_at,
      profiles(full_name, email),
      orders(order_number, project_name, units)
    `)
    .order("changed_at", { ascending: false })
    .limit(5);

  const activityLogs = (rawLogs ?? []).map((log: any) => {
    const user = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
    const ord = Array.isArray(log.orders) ? log.orders[0] : log.orders;
    return {
      id: log.id,
      old_status: log.old_status,
      new_status: log.new_status,
      note: log.note,
      changed_at: log.changed_at,
      userName: user?.full_name || user?.email || "System",
      orderNumber: ord?.order_number || "Order",
      projectName: ord?.project_name || "PCB Assembly",
      units: ord?.units || 0,
    };
  });

  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  // ── Groupings ──
  const newRequests = orders.filter((o) => o.status === "quote_pending");
  const awaitingPayment = orders.filter((o) => o.status === "quote_ready");
  const activeOrders = orders.filter((o) =>
    ["payment_completed", "components_received", "in_assembly", "inspection", "ready_for_delivery"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const delayedOrders = orders.filter((o) => {
    if (!o.expected_delivery || o.status === "delivered") return false;
    return new Date(o.expected_delivery) < today;
  });

  // ── Stats changes ──
  const newRequestsToday = orders.filter(
    (o) => o.status === "quote_pending" && new Date(o.created_at) >= todayStart
  ).length;

  const activeToday = orders.filter(
    (o) => ["payment_completed", "components_received", "in_assembly", "inspection", "ready_for_delivery"].includes(o.status) && new Date(o.created_at) >= todayStart
  ).length;

  // ── Stats Summary Values ──
  const statsList = [
    {
      label: "New Requests",
      val: newRequests.length,
      changeText: `+${newRequestsToday} today`,
      changeClass: "ch-up",
      iconClass: "si-warn",
      icon: <Clock className="w-[19px] h-[19px]" />,
      barWidth: orders.length > 0 ? `${(newRequests.length / orders.length) * 100}%` : "0%",
      barColor: "var(--warning)"
    },
    {
      label: "Awaiting Payment",
      val: awaitingPayment.length,
      changeText: "No change",
      changeClass: "ch-same",
      iconClass: "si-blue",
      icon: <CheckSquare className="w-[19px] h-[19px]" />,
      barWidth: orders.length > 0 ? `${(awaitingPayment.length / orders.length) * 100}%` : "0%",
      barColor: "var(--info)"
    },
    {
      label: "Active Orders",
      val: activeOrders.length,
      changeText: `+${activeToday} today`,
      changeClass: "ch-up",
      iconClass: "si-purple",
      icon: <Package className="w-[19px] h-[19px]" />,
      barWidth: orders.length > 0 ? `${(activeOrders.length / orders.length) * 100}%` : "0%",
      barColor: "var(--p4)"
    },
    {
      label: "Need Attention",
      val: delayedOrders.length,
      changeText: delayedOrders.length > 0 ? "Urgent!" : "All Good",
      changeClass: delayedOrders.length > 0 ? "ch-down" : "ch-up",
      iconClass: "si-danger",
      icon: <AlertTriangle className="w-[19px] h-[19px]" />,
      barWidth: orders.length > 0 ? `${(delayedOrders.length / orders.length) * 100}%` : "0%",
      barColor: "var(--danger)"
    }
  ];

  // ── Financials calculations ──
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => {
    const q = o.quotes?.[0];
    return sum + (q?.amount_lkr || 0);
  }, 0);

  const activeRevenue = activeOrders.reduce((sum, o) => {
    const q = o.quotes?.[0];
    return sum + (q?.amount_lkr || 0);
  }, 0);

  const pendingRevenue = awaitingPayment.reduce((sum, o) => {
    const q = o.quotes?.[0];
    return sum + (q?.amount_lkr || 0);
  }, 0);

  const totalRevenue = deliveredRevenue + activeRevenue + pendingRevenue;

  // Percentage shares
  const delShare = totalRevenue > 0 ? Math.round((deliveredRevenue / totalRevenue) * 100) : 0;
  const actShare = totalRevenue > 0 ? Math.round((activeRevenue / totalRevenue) * 100) : 0;
  const penShare = totalRevenue > 0 ? Math.round((pendingRevenue / totalRevenue) * 100) : 0;

  // Turnaround calc
  const turnaroundOrders = orders.filter((o) => o.status === "delivered" && o.expected_delivery);
  let avgTurnaround = 8;
  if (turnaroundOrders.length > 0) {
    const diffs = turnaroundOrders.map((o) => {
      const start = new Date(o.created_at);
      const end = new Date(o.expected_delivery!);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    });
    avgTurnaround = Math.max(1, Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length));
  }

  const deliveredToday = orders.filter(
    (o) => o.status === "delivered" && new Date(o.created_at) >= todayStart
  ).length;

  // Format date readable
  const formatHeaderDate = () => {
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Activity icon/label decider
  const getActivityDot = (status: OrderStatus) => {
    switch (status) {
      case "quote_pending": return { emoji: "⏰", class: "ad-warn" };
      case "quote_ready": return { emoji: "✉️", class: "ad-blue" };
      case "payment_completed": return { emoji: "✅", class: "ad-green" };
      case "in_assembly": return { emoji: "🔧", class: "ad-purple" };
      case "inspection": return { emoji: "🔍", class: "ad-purple" };
      case "ready_for_delivery": return { emoji: "📦", class: "ad-purple" };
      case "delivered": return { emoji: "🚚", class: "ad-green" };
      default: return { emoji: "⚙️", class: "ad-blue" };
    }
  };

  const getActivityTitle = (status: OrderStatus) => {
    switch (status) {
      case "quote_pending": return "New request submitted";
      case "quote_ready": return "Quote sent to customer";
      case "payment_completed": return "Payment received & verified";
      case "in_assembly": return "Assembly stage started";
      case "inspection": return "Board inspection started";
      case "ready_for_delivery": return "Package ready for delivery";
      case "delivered": return "Order marked delivered";
      default: return "Status updated";
    }
  };

  const isDashboard = !searchFilter;
  const isAllOrders = searchFilter === "all";

  return (
    <>
      <DashboardAutoRefresh interval={settings.dashboardAutoRefresh} />

      {/* STATS - Only show on main dashboard */}
      {isDashboard && (
        <div className="stats">
          {statsList.map((stat, idx) => (
            <div className="sc" key={idx}>
              <div className="sc-top">
                <div className={`sc-icon ${stat.iconClass}`}>{stat.icon}</div>
                <span className={`sc-change ${stat.changeClass}`}>{stat.changeText}</span>
              </div>
              <div className="sc-val">{stat.val}</div>
              <div className="sc-lbl">{stat.label}</div>
              <div className="sc-bar">
                <div className="sc-bar-fill" style={{ width: stat.barWidth, background: stat.barColor }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAIN GRID */}
      <div className="main-grid" style={isAllOrders ? { gridTemplateColumns: "1fr" } : undefined}>
        <div className="left-col">
          
          {/* ALL ORDERS VIEW */}
          {isAllOrders && (
            <div className="card">
              <div className="card-head">
                <div className="ch-ic blue"><Package /></div>
                <div>
                  <div className="ch-ttl">All Orders Master List</div>
                  <div className="ch-sub">Complete history of all PCB assemblies</div>
                </div>
                <div className="ch-right">
                  <span className="count-badge cb-blue">{orders.length} total</span>
                </div>
              </div>
              <div className="tbl-wrap">
                {orders.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text3)" }}>No orders found.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Project</th>
                        <th>Units</th><th>Status</th><th>Submitted</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const cust = orderCustomer(o.profiles as OrderProfile | OrderProfile[] | null);
                        const avInitials = cust?.full_name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || cust?.email[0].toUpperCase() || "C";
                        const pillConfig = STATUS_PILL_CONFIG[o.status] || { className: "p-blue", label: o.status };
                        return (
                          <tr key={o.id}>
                            <td><Link href={`/admin/orders/${o.id}`} className="order-link">{o.order_number}</Link></td>
                            <td>
                              <div className="cust-cell">
                                <div className={`cust-av ${getAvClass(cust?.email || "")}`}>{avInitials}</div>
                                <span className="cust-name">{cust?.full_name || cust?.email}</span>
                              </div>
                            </td>
                            <td>{o.project_name}</td>
                            <td>{o.units}</td>
                            <td>
                              <span className={`pill ${pillConfig.className}`}>
                                <span className="pill-dot"></span>{pillConfig.label}
                              </span>
                            </td>
                            <td style={{ color: "var(--text3)", fontSize: "0.78125rem" }}>{formatDate(o.created_at)}</td>
                            <td>
                              <div className="tbl-actions">
                                <Link href={`/admin/orders/${o.id}`} className="ta-btn ta-view" style={{ textDecoration: "none" }}>View</Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* New Requests Section */}
          {(!searchFilter || searchFilter === "needs-quote") && (
            <div className="card">
              <div className="card-head">
                <div className="ch-ic warn"><Clock /></div>
                <div>
                  <div className="ch-ttl">New Requests — Needs Quote</div>
                  <div className="ch-sub">Awaiting engineer review & pricing</div>
                </div>
                <div className="ch-right">
                  <span className="count-badge cb-warn">{newRequests.length} pending</span>
                </div>
              </div>
              <div className="tbl-wrap">
                {newRequests.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text3)" }}>No new requests pending.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Project</th>
                        <th>Units</th><th>Status</th><th>Submitted</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newRequests.map((o) => {
                        const cust = orderCustomer(o.profiles as OrderProfile | OrderProfile[] | null);
                        const avInitials = cust?.full_name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || cust?.email[0].toUpperCase() || "C";
                        return (
                          <tr key={o.id}>
                            <td><Link href={`/admin/orders/${o.id}`} className="order-link">{o.order_number}</Link></td>
                            <td>
                              <div className="cust-cell">
                                <div className={`cust-av ${getAvClass(cust?.email || "")}`}>{avInitials}</div>
                                <span className="cust-name">{cust?.full_name || cust?.email}</span>
                              </div>
                            </td>
                            <td>{o.project_name}</td>
                            <td>{o.units}</td>
                            <td><span className="pill p-pending"><span className="pill-dot"></span>Quote Pending</span></td>
                            <td style={{ color: "var(--text3)", fontSize: "0.78125rem" }}>{formatDate(o.created_at)}</td>
                            <td>
                              <div className="tbl-actions">
                                <Link href={`/admin/orders/${o.id}`} className="ta-btn ta-quote" style={{ textDecoration: "none" }}>Send Quote</Link>
                                <Link href={`/admin/orders/${o.id}`} className="ta-btn ta-view" style={{ textDecoration: "none" }}>View</Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Awaiting Payment Section */}
          {(!searchFilter || searchFilter === "awaiting-payment") && (
            <div className="card">
              <div className="card-head">
                <div className="ch-ic blue"><CheckSquare /></div>
                <div>
                  <div className="ch-ttl">Quote Sent — Awaiting Payment</div>
                  <div className="ch-sub">Quote delivered, waiting for customer payment</div>
                </div>
                <div className="ch-right">
                  <span className="count-badge cb-blue">{awaitingPayment.length} orders</span>
                </div>
              </div>
              <div className="tbl-wrap tbl-money">
                {awaitingPayment.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text3)" }}>No orders awaiting payment.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Project</th><th>Units</th><th>Status</th><th>Quote</th><th>Deadline</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awaitingPayment.map((o) => {
                        const cust = orderCustomer(o.profiles as OrderProfile | OrderProfile[] | null);
                        const avInitials = cust?.full_name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || cust?.email[0].toUpperCase() || "C";
                        const quote = o.quotes?.[0];
                        const isDelayed = o.expected_delivery && new Date(o.expected_delivery) < today;
                        return (
                          <tr key={o.id}>
                            <td><Link href={`/admin/orders/${o.id}`} className="order-link">{o.order_number}</Link></td>
                            <td>
                              <div className="cust-cell">
                                <div className={`cust-av ${getAvClass(cust?.email || "")}`}>{avInitials}</div>
                                <span className="cust-name">{cust?.full_name || cust?.email}</span>
                              </div>
                            </td>
                            <td>{o.project_name}</td>
                            <td>{o.units}</td>
                            <td><span className="pill p-ready"><span className="pill-dot"></span>Quote Ready</span></td>
                            <td><span className="quote-val">{quote ? formatLKR(quote.amount_lkr) : "—"}</span></td>
                            <td>
                              {isDelayed ? (
                                <span className="deadline-warn"><AlertTriangle />{formatDate(o.expected_delivery)}</span>
                              ) : (
                                <span className="deadline-ok">{formatDate(o.expected_delivery)}</span>
                              )}
                            </td>
                            <td>
                              <div className="tbl-actions">
                                <Link href="/admin/messages" className="ta-btn ta-msg" style={{ textDecoration: "none" }}>Message</Link>
                                <Link href={`/admin/orders/${o.id}`} className="ta-btn ta-view" style={{ textDecoration: "none" }}>View</Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Active Orders Section */}
          {(!searchFilter || searchFilter === "active") && (
            <div className="card">
              <div className="card-head">
                <div className="ch-ic purple"><Package /></div>
                <div>
                  <div className="ch-ttl">Active Orders — In Production</div>
                  <div className="ch-sub">Orders currently being assembled</div>
                </div>
                <div className="ch-right">
                  <span className="count-badge cb-purple">{activeOrders.length} active</span>
                </div>
              </div>
              <div className="tbl-wrap tbl-money">
                {activeOrders.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text3)" }}>No active orders in production.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Project</th><th>Units</th><th>Status</th><th>Quote</th><th>Deadline</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrders.map((o) => {
                        const cust = orderCustomer(o.profiles as OrderProfile | OrderProfile[] | null);
                        const avInitials = cust?.full_name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || cust?.email[0].toUpperCase() || "C";
                        const quote = o.quotes?.[0];
                        const pillConfig = STATUS_PILL_CONFIG[o.status] || { className: "p-assembly", label: "In Assembly" };
                        const isDelayed = o.expected_delivery && new Date(o.expected_delivery) < today;
                        return (
                          <tr key={o.id}>
                            <td><Link href={`/admin/orders/${o.id}`} className="order-link">{o.order_number}</Link></td>
                            <td>
                              <div className="cust-cell">
                                <div className={`cust-av ${getAvClass(cust?.email || "")}`}>{avInitials}</div>
                                <span className="cust-name">{cust?.full_name || cust?.email}</span>
                              </div>
                            </td>
                            <td>{o.project_name}</td>
                            <td>{o.units}</td>
                            <td>
                              <span className={`pill ${pillConfig.className}`}>
                                <span className="pill-dot"></span>
                                {pillConfig.label}
                              </span>
                            </td>
                            <td><span className="quote-val">{quote ? formatLKR(quote.amount_lkr) : "—"}</span></td>
                            <td>
                              {isDelayed ? (
                                <span className="deadline-warn"><AlertTriangle />{formatDate(o.expected_delivery)}</span>
                              ) : (
                                <span className="deadline-ok">{formatDate(o.expected_delivery)}</span>
                              )}
                            </td>
                            <td>
                              <div className="tbl-actions">
                                <Link href={`/admin/orders/${o.id}`} className="ta-btn ta-msg" style={{ textDecoration: "none" }}>Update</Link>
                                <Link href={`/admin/orders/${o.id}`} className="ta-btn ta-view" style={{ textDecoration: "none" }}>View</Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Delivered Orders Section */}
          {(searchFilter === "delivered" || (searchFilter === "all" && deliveredOrders.length > 0)) && (
            <div className="card">
              <div className="card-head">
                <div className="ch-ic green" style={{ background: "rgba(52, 211, 153, 0.14)", borderColor: "rgba(52, 211, 153, 0.2)", color: "var(--success)" }}><Package /></div>
                <div>
                  <div className="ch-ttl">Delivered Orders</div>
                  <div className="ch-sub">Successfully completed orders</div>
                </div>
                <div className="ch-right">
                  <span className="count-badge cb-green">{deliveredOrders.length} completed</span>
                </div>
              </div>
              <div className="tbl-wrap tbl-money">
                {deliveredOrders.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text3)" }}>No delivered orders yet.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Project</th><th>Units</th><th>Status</th><th>Quote</th><th>Delivery</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveredOrders.map((o) => {
                        const cust = orderCustomer(o.profiles as OrderProfile | OrderProfile[] | null);
                        const avInitials = cust?.full_name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || cust?.email[0].toUpperCase() || "C";
                        const quote = o.quotes?.[0];
                        return (
                          <tr key={o.id}>
                            <td><Link href={`/admin/orders/${o.id}`} className="order-link">{o.order_number}</Link></td>
                            <td>
                              <div className="cust-cell">
                                <div className={`cust-av ${getAvClass(cust?.email || "")}`}>{avInitials}</div>
                                <span className="cust-name">{cust?.full_name || cust?.email}</span>
                              </div>
                            </td>
                            <td>{o.project_name}</td>
                            <td>{o.units}</td>
                            <td><span className="pill p-delivered"><span className="pill-dot"></span>Delivered</span></td>
                            <td><span className="quote-val">{quote ? formatLKR(quote.amount_lkr) : "—"}</span></td>
                            <td><span className="deadline-ok">{formatDate(o.expected_delivery)}</span></td>
                            <td>
                              <div className="tbl-actions">
                                <Link href={`/admin/orders/${o.id}`} className="ta-btn ta-view" style={{ textDecoration: "none" }}>View</Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-col">
          {/* Revenue Overview */}
          <div className="card">
            <div className="card-head" style={{ padding: "16px 20px" }}>
              <div className="ch-ttl">Revenue Overview</div>
            </div>
            <div style={{ padding: "14px 20px 6px" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.75rem", color: "var(--success)", letterSpacing: "-.3px", marginBottom: "3px" }}>
                {formatLKR(totalRevenue)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text3)" }}>Total this month</div>
            </div>
            <div className="mini-stats">
              <div>
                <div className="ms-row">
                  <div className="ms-lbl"><TrendingUp className="w-3.5 h-3.5" />Delivered</div>
                  <div className="ms-val" style={{ color: "var(--success)" }}>{formatLKR(deliveredRevenue)}</div>
                </div>
                <div className="ms-bar-wrap">
                  <div className="ms-bar" style={{ width: `${delShare}%`, background: "var(--success)" }}></div>
                </div>
              </div>
              <div>
                <div className="ms-row">
                  <div className="ms-lbl"><Activity className="w-3.5 h-3.5" />In Production</div>
                  <div className="ms-val" style={{ color: "var(--p3)" }}>{formatLKR(activeRevenue)}</div>
                </div>
                <div className="ms-bar-wrap">
                  <div className="ms-bar" style={{ width: `${actShare}%`, background: "var(--p4)" }}></div>
                </div>
              </div>
              <div>
                <div className="ms-row">
                  <div className="ms-lbl"><Clock className="w-3.5 h-3.5" />Pending</div>
                  <div className="ms-val" style={{ color: "var(--warning)" }}>{formatLKR(pendingRevenue)}</div>
                </div>
                <div className="ms-bar-wrap">
                  <div className="ms-bar" style={{ width: `${penShare}%`, background: "var(--warning)" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="card">
            <div className="card-head" style={{ padding: "16px 20px" }}>
              <div className="ch-ttl">Live Activity</div>
              <div className="ch-right"><div className="live-dot"></div></div>
            </div>
            <div className="act-body">
              {activityLogs.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text3)", fontSize: "0.78125rem", padding: "12px 0" }}>No recent activity.</div>
              ) : (
                activityLogs.map((log: any) => {
                  const cfg = getActivityDot(log.new_status);
                  const minsDiff = Math.round((Date.now() - new Date(log.changed_at).getTime()) / 60000);
                  const timeText = minsDiff < 1 ? "Just now" : minsDiff < 60 ? `${minsDiff}m ago` : minsDiff < 1440 ? `${Math.round(minsDiff/60)}h ago` : formatDate(log.changed_at);

                  return (
                    <div className="act-item" key={log.id}>
                      <div className={`act-dot ${cfg.class}`}>{cfg.emoji}</div>
                      <div className="act-body-txt">
                        <div className="act-title">{getActivityTitle(log.new_status)}</div>
                        <div className="act-desc">
                          {log.orderNumber} by {log.userName} · {log.projectName}
                        </div>
                        <div className="act-time">{timeText}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Today's Summary */}
          <div className="card">
            <div className="card-head" style={{ padding: "16px 20px" }}>
              <div className="ch-ttl">Today's Summary</div>
            </div>
            <div className="mini-stats">
              <div className="ms-row">
                <div className="ms-lbl"><Users className="w-3.5 h-3.5" />Total Customers</div>
                <div className="ms-val">{customerCount || 0}</div>
              </div>
              <div className="ms-row">
                <div className="ms-lbl"><Package className="w-3.5 h-3.5" />Total Orders</div>
                <div className="ms-val">{orders.length}</div>
              </div>
              <div className="ms-row">
                <div className="ms-lbl"><TrendingUp className="w-3.5 h-3.5" />Avg. Turnaround</div>
                <div className="ms-val" style={{ color: "var(--success)" }}>{avgTurnaround} days</div>
              </div>
              <div className="ms-row">
                <div className="ms-lbl"><CheckSquare className="w-3.5 h-3.5" />Delivered Today</div>
                <div className="ms-val" style={{ color: "var(--success)" }}>{deliveredToday}</div>
              </div>
              <div className="ms-row">
                <div className="ms-lbl"><MessageSquare className="w-3.5 h-3.5" />Unread Messages</div>
                <div className="ms-val" style={{ color: unreadMessages && unreadMessages > 0 ? "var(--danger)" : "inherit" }}>
                  {unreadMessages || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
