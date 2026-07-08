"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import UnifiedSignOutButton from "@/components/shared/SignOutButton";
import { LogOut, X } from "lucide-react";
import QuickThemeToggle from "@/components/shared/QuickThemeToggle";

interface AdminSidebarProps {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
  };
  counts: {
    all: number;
    needsQuote: number;
    awaitingPayment: number;
    activeAssembly: number;
    delivered: number;
    unreadMessages: number;
  };
}

export default function AdminSidebar({ profile, counts }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("filter");

  // Determine active states
  const isDashboardActive = pathname === "/admin/dashboard" && !activeFilter;
  const isAllOrdersActive = pathname === "/admin/dashboard" && activeFilter === "all";
  const isNeedsQuoteActive = pathname === "/admin/dashboard" && activeFilter === "needs-quote";
  const isAwaitingPaymentActive = pathname === "/admin/dashboard" && activeFilter === "awaiting-payment";
  const isActiveAssemblyActive = pathname === "/admin/dashboard" && activeFilter === "active";
  const isDeliveredActive = pathname === "/admin/dashboard" && activeFilter === "delivered";
  const isUsersActive = pathname.startsWith("/admin/users");
  const isMessagesActive = pathname.startsWith("/admin/messages");
  const isInvoicesActive = pathname === "/admin/invoices"; // mock or simple
  const isSettingsActive = pathname.startsWith("/admin/settings");

  // Track which filter link was just clicked so we can give immediate visual feedback
  // while the server is re-rendering.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Clear the pending state once the URL actually settles (navigation complete).
  useEffect(() => {
    setPendingHref(null);
  }, [pathname, activeFilter]);

  function markPending(href: string) {
    setPendingHref(href);
  }

  const name = profile.full_name || profile.email || "Administrator";
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile.email?.[0]?.toUpperCase() || "A";

  const closeSidebar = () => {
    document.querySelector(".admin-layout-root")?.classList.remove("sidebar-open");
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div className="mobile-backdrop" onClick={closeSidebar}></div>

      <aside className="sidebar">
        <div className="s-logo">
          <Link href="/"><img src="/protonest-logo.png" alt="Protonest" style={{ height: 40, width: "auto" }} /></Link>
          <span className="admin-badge" style={{ marginLeft: "auto" }}>Admin</span>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1.5 ml-2 text-slate-400 hover:text-white transition-colors focus:outline-none rounded-md hover:bg-slate-800/40"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="s-nav">
          <div className="s-lbl">Overview</div>
          <Link href="/admin/dashboard" onClick={closeSidebar} className={`ni ${isDashboardActive ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </Link>
          <Link href="/admin/dashboard?filter=all" onClick={() => { markPending("/admin/dashboard?filter=all"); closeSidebar(); }} className={`ni ${isAllOrdersActive || pendingHref === "/admin/dashboard?filter=all" ? "active" : ""} ${pendingHref === "/admin/dashboard?filter=all" ? "ni-pending" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            All Orders
            <span className="ni-ct ct-warn">{counts.all}</span>
          </Link>
          <Link href="/admin/dashboard?filter=needs-quote" onClick={() => { markPending("/admin/dashboard?filter=needs-quote"); closeSidebar(); }} className={`ni ${isNeedsQuoteActive || pendingHref === "/admin/dashboard?filter=needs-quote" ? "active" : ""} ${pendingHref === "/admin/dashboard?filter=needs-quote" ? "ni-pending" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Needs Quote
            <span className="ni-ct ct-warn">{counts.needsQuote}</span>
          </Link>
          <Link href="/admin/dashboard?filter=awaiting-payment" onClick={() => { markPending("/admin/dashboard?filter=awaiting-payment"); closeSidebar(); }} className={`ni ${isAwaitingPaymentActive || pendingHref === "/admin/dashboard?filter=awaiting-payment" ? "active" : ""} ${pendingHref === "/admin/dashboard?filter=awaiting-payment" ? "ni-pending" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Awaiting Payment
            <span className="ni-ct ct-blue">{counts.awaitingPayment}</span>
          </Link>
          <Link href="/admin/dashboard?filter=active" onClick={() => { markPending("/admin/dashboard?filter=active"); closeSidebar(); }} className={`ni ${isActiveAssemblyActive || pendingHref === "/admin/dashboard?filter=active" ? "active" : ""} ${pendingHref === "/admin/dashboard?filter=active" ? "ni-pending" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            Active Assembly
            <span className="ni-ct ct-purple">{counts.activeAssembly}</span>
          </Link>
          <Link href="/admin/dashboard?filter=delivered" onClick={() => { markPending("/admin/dashboard?filter=delivered"); closeSidebar(); }} className={`ni ${isDeliveredActive || pendingHref === "/admin/dashboard?filter=delivered" ? "active" : ""} ${pendingHref === "/admin/dashboard?filter=delivered" ? "ni-pending" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Delivered
            <span className="ni-ct ct-green">{counts.delivered}</span>
          </Link>

          <div className="s-lbl">Manage</div>
          <Link href="/admin/users" onClick={closeSidebar} className={`ni ${isUsersActive ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Users
          </Link>
          <Link href="/admin/messages" onClick={closeSidebar} className={`ni ${isMessagesActive ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Messages
            {counts.unreadMessages > 0 && (
              <span className="ni-ct ct-danger">{counts.unreadMessages}</span>
            )}
          </Link>
          <Link href="/admin/dashboard?filter=awaiting-payment" onClick={closeSidebar} className={`ni ${isInvoicesActive ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Invoices
          </Link>
          <Link href="/admin/settings" onClick={closeSidebar} className={`ni ${isSettingsActive ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </Link>
          <div style={{ marginTop: "auto", width: "100%" }} onClick={closeSidebar}>
            <UnifiedSignOutButton className="ni w-full text-left" title="Sign Out">
              <LogOut style={{ width: "16px", height: "16px", color: "var(--danger)" }} />
              <span style={{ color: "var(--danger)" }}>Sign Out</span>
            </UnifiedSignOutButton>
          </div>
        </nav>
        <div className="s-footer" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/admin/settings" onClick={closeSidebar} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
            <div className="s-user">
              <div className="s-av">{initials}</div>
              <div>
                <div className="s-un">{name}</div>
                <div className="s-ur">Administrator</div>
              </div>
            </div>
          </Link>
          <QuickThemeToggle
            style={{
              width: 28, height: 28,
              borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(91,66,232,.08)",
              border: "1px solid var(--border)",
              color: "var(--text2)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background .18s, color .18s, border-color .18s",
            }}
            iconSize={13}
          />
        </div>
      </aside>
    </>
  );
}
