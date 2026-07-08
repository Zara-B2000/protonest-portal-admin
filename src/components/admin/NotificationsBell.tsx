"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Mail, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

type NotificationRow = {
  id: string;
  event_type: string;
  channel: "email" | "sms";
  status: "sent" | "failed" | "skipped";
  recipient: string;
  error_reason: string | null;
  sent_at: string;
  orders: { order_number: string } | { order_number: string }[] | null;
};

type UnreadConv = {
  id: string;
  unread_count: number;
  last_message: { body: string; created_at: string } | null;
  profiles: { full_name: string | null; email: string } | null;
};

const EVENT_LABELS: Record<string, string> = {
  order_submitted: "Order submitted",
  admin_new_order: "New order received",
  quote_ready: "Quote sent to customer",
  payment_completed: "Payment confirmed",
  ready_for_delivery: "Order ready for delivery",
  components_received: "Components received",
  in_assembly: "Order moved to assembly",
  inspection: "Order in inspection",
  delivered: "Order delivered",
  discount_token_issued: "Discount token issued",
  payment_amount_mismatch: "Payment amount mismatch",
};

function getOrderNumber(row: NotificationRow): string | null {
  const orders = row.orders;
  if (!orders) return null;
  if (Array.isArray(orders)) return orders[0]?.order_number ?? null;
  return orders.order_number ?? null;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadConvs, setUnreadConvs] = useState<UnreadConv[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(() => {
    fetch("/api/messages/conversations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadConvs(data.filter((c: UnreadConv) => c.unread_count > 0));
        }
      })
      .catch(() => {});
  }, []);

  // Eagerly load unread count so badge shows immediately; poll every 30s
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchUnread(); // refresh unread on every open
      if (!loaded) {
        setLoading(true);
        try {
          const res = await fetch("/api/admin/notifications");
          if (res.ok) {
            const data = await res.json();
            setNotifications(data.notifications ?? []);
          }
        } finally {
          setLoading(false);
          setLoaded(true);
        }
      }
    }
  };

  const totalUnread = unreadConvs.reduce((s, c) => s + c.unread_count, 0);
  const hasRecentNotifs = notifications.some(
    (n) => Date.now() - new Date(n.sent_at).getTime() < 24 * 60 * 60 * 1000
  );

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button type="button" className="btn-icon" title="Notifications" onClick={toggleOpen}>
        <Bell />
        {totalUnread > 0 ? (
          <span className="notif-count-badge">{totalUnread > 9 ? "9+" : totalUnread}</span>
        ) : hasRecentNotifs ? (
          <span className="notif-dot"></span>
        ) : null}
      </button>

      {open && (
        <div className="notif-dropdown">

          {/* ── Unread Messages Section ── */}
          {unreadConvs.length > 0 && (
            <>
              <div className="notif-section-head">
                <MessageSquare className="w-3 h-3" />
                Unread Messages
                <span className="notif-section-ct">{totalUnread}</span>
              </div>
              <div className="notif-msg-body">
                {unreadConvs.map((conv) => {
                  const name =
                    conv.profiles?.full_name || conv.profiles?.email || "Customer";
                  return (
                    <Link
                      key={conv.id}
                      href="/admin/messages"
                      className="notif-item-msg"
                      onClick={() => setOpen(false)}
                    >
                      <div className="notif-icon-msg">
                        <MessageSquare />
                      </div>
                      <div className="notif-item-body">
                        <div className="notif-item-title">
                          {name}
                          {conv.unread_count > 1 && (
                            <span className="notif-msg-ct">{conv.unread_count}</span>
                          )}
                        </div>
                        {conv.last_message && (
                          <div className="notif-msg-preview">
                            {conv.last_message.body.slice(0, 58)}
                            {conv.last_message.body.length > 58 ? "…" : ""}
                          </div>
                        )}
                        {conv.last_message && (
                          <div className="notif-item-meta">
                            {timeAgo(conv.last_message.created_at)}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* ── System Notifications Section ── */}
          <div className="notif-dropdown-head">
            {unreadConvs.length > 0 ? "System Notifications" : "Recent Notifications"}
          </div>
          <div className="notif-dropdown-body">
            {loading ? (
              <div className="notif-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No recent notifications</div>
            ) : (
              notifications.map((n) => {
                const orderNumber = getOrderNumber(n);
                const label = EVENT_LABELS[n.event_type] ?? n.event_type;
                return (
                  <div className="notif-item" key={n.id}>
                    <div
                      className={`notif-item-icon${n.status === "failed" ? " is-failed" : ""}`}
                    >
                      {n.status === "failed" ? (
                        <AlertCircle />
                      ) : n.channel === "sms" ? (
                        <MessageSquare />
                      ) : (
                        <Mail />
                      )}
                    </div>
                    <div className="notif-item-body">
                      <div className="notif-item-title">
                        {label}
                        {orderNumber ? ` — ${orderNumber}` : ""}
                      </div>
                      <div className="notif-item-meta">
                        {n.channel.toUpperCase()} · {n.status === "failed" ? "Failed" : "Sent"} ·{" "}
                        {timeAgo(n.sent_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
