"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusTimeline } from "@/components/shared/StatusTimeline";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatDate, formatDateTime, formatLKR, formatFileSize } from "@/utils";
import {
  ASSEMBLY_TYPE_LABELS, INSPECTION_LEVEL_LABELS, FILE_TYPE_LABELS,
  ORDER_STATUS_STEPS, type OrderStatus
} from "@/types";
import { FileDown, Save, Send, ChevronRight, Loader2, Banknote, Gift } from "lucide-react";
import Link from "next/link";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [quoteAmount, setQuoteAmount]         = useState("");
  const [quoteCustomerNotes, setQuoteCustomerNotes] = useState("");
  const [quoteAdminNotes,    setQuoteAdminNotes]    = useState("");
  const [quoteDays,          setQuoteDays]          = useState("7");
  const [savingQuote,        setSavingQuote]        = useState(false);
  const [quoteMsg,           setQuoteMsg]           = useState("");

  const [newStatus,        setNewStatus]        = useState<OrderStatus | "">("");
  const [statusNote,       setStatusNote]       = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [updatingStatus,   setUpdatingStatus]   = useState(false);
  const [statusMsg,        setStatusMsg]        = useState("");

  const [noteText,   setNoteText]   = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg,    setNoteMsg]    = useState("");

  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentMsg,        setPaymentMsg]        = useState("");

  const [tokenType,    setTokenType]    = useState<"fixed" | "percentage">("fixed");
  const [tokenValue,   setTokenValue]   = useState("500");
  const [tokenDays,    setTokenDays]    = useState("90");
  const [issuingToken, setIssuingToken] = useState(false);
  const [tokenMsg,     setTokenMsg]     = useState("");

  async function loadOrder() {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrder(); }, [id]);

  async function saveQuote() {
    if (!quoteAmount) return;
    setSavingQuote(true); setQuoteMsg("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: id,
        amount_lkr: parseFloat(quoteAmount),
        customer_notes: quoteCustomerNotes || null,
        admin_notes:    quoteAdminNotes    || null,
        valid_days:     parseInt(quoteDays),
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      setQuoteMsg("Error: " + (result.error ?? "Failed"));
    } else {
      setQuoteMsg("Quote saved and sent to customer!");
      await loadOrder();
      setTimeout(() => setQuoteMsg(""), 4000);
    }
    setSavingQuote(false);
  }

  async function updateStatus() {
    if (!newStatus) return;
    setUpdatingStatus(true); setStatusMsg("");
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: id, new_status: newStatus,
        note: statusNote || null,
        expected_delivery: expectedDelivery || null,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      setStatusMsg("Error: " + (result.error ?? "Failed"));
    } else {
      setStatusMsg("Status updated!");
      setNewStatus("");
      setStatusNote("");
      await loadOrder();
      setTimeout(() => setStatusMsg(""), 4000);
    }
    setUpdatingStatus(false);
  }

  async function saveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    setNoteMsg("");
    const res = await fetch(`/api/admin/orders/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_text: noteText }),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      setNoteMsg("Error: " + (result.error ?? "Failed to save note"));
      setSavingNote(false);
      return;
    }
    setNoteText("");
    await loadOrder();
    setNoteMsg("Note saved");
    setSavingNote(false);
    setTimeout(() => setNoteMsg(""), 3000);
  }

  async function confirmBankTransfer() {
    setConfirmingPayment(true); setPaymentMsg("");
    const res    = await fetch(`/api/admin/orders/${id}/confirm-payment`, { method: "POST" });
    const result = await res.json();
    if (!res.ok) setPaymentMsg("Error: " + (result.error ?? "Failed"));
    else { setPaymentMsg("Payment confirmed — customer notified."); await loadOrder(); }
    setConfirmingPayment(false);
  }

  async function issueDiscountToken() {
    setIssuingToken(true); setTokenMsg("");
    const res    = await fetch(`/api/admin/orders/${id}/discount-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discount_type:  tokenType,
        discount_value: parseFloat(tokenValue),
        valid_days:     parseInt(tokenDays),
      }),
    });
    const result = await res.json();
    if (!res.ok) setTokenMsg("Error: " + (result.error ?? "Failed"));
    else setTokenMsg(`Token issued: ${result.token.token_code} — emailed to customer.`);
    await loadOrder(); setIssuingToken(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--p3, #9D82F8)" }} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="od-card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <p className="od-msg-err" style={{ marginBottom: 12 }}>{loadError}</p>
        <button className="od-btn od-btn-primary" onClick={() => { setLoadError(""); setLoading(true); loadOrder(); }}>
          Retry
        </button>
      </div>
    );
  }

  const order          = data?.order          as Record<string, unknown>;
  const files          = data?.files          as Array<Record<string, unknown>> ?? [];
  const quotes         = data?.quotes         as Array<Record<string, unknown>> ?? [];
  const statusHistory  = data?.statusHistory  as Array<Record<string, unknown>> ?? [];
  const adminNotes     = data?.adminNotes     as Array<Record<string, unknown>> ?? [];
  const payments       = data?.payments       as Array<Record<string, unknown>> ?? [];
  const discountTokens = data?.discountTokens as Array<Record<string, unknown>> ?? [];
  const sourcing       = data?.sourcing       as Record<string, unknown> | null;

  const pendingBankTransfer = payments.find(
    (p) => p.gateway === "bank_transfer" && p.status === "pending"
  );

  const currentStatusIndex = ORDER_STATUS_STEPS.findIndex((s) => s.status === order?.status);
  const nextStatuses = ORDER_STATUS_STEPS
    .slice(currentStatusIndex + 1)
    .map((s) => s.status)
    // quote_ready is set only by submitting a quote, never via Update Status
    .filter((s) => s !== "quote_ready");

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold font-mono" style={{ color: "var(--p3)" }}>
            {order?.order_number as string}
          </h1>
          <OrderStatusBadge status={order?.status as OrderStatus} />
        </div>
        <Link href="/admin/dashboard" className="od-muted text-sm hover:underline">
          ← Dashboard
        </Link>
      </div>

      <StatusTimeline
        currentStatus={order?.status as OrderStatus}
        history={statusHistory as unknown as Parameters<typeof StatusTimeline>[0]["history"]}
      />

      {/* ── Customer + Order Info ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="od-card">
          <p className="od-sec-title">Customer</p>
          {(["full_name", "email", "phone", "company"] as const).map((k) => {
            const profile = data?.customer as Record<string, string | null>;
            return profile?.[k] ? (
              <div key={k} className="mb-1.5">
                <span className="od-key capitalize">{k.replace("_", " ")}: </span>
                <span className="od-val">{profile[k]}</span>
              </div>
            ) : null;
          })}
        </div>

        <div className="od-card">
          <p className="od-sec-title">Order Details</p>
          {[
            ["Project",    order?.project_name],
            ["Units",      order?.units],
            ["Assembly",   ASSEMBLY_TYPE_LABELS[order?.assembly_type   as keyof typeof ASSEMBLY_TYPE_LABELS]],
            ["Inspection", INSPECTION_LEVEL_LABELS[order?.inspection_level as keyof typeof INSPECTION_LEVEL_LABELS]],
            ["Submitted",  formatDate(order?.created_at as string)],
          ].map(([l, v]) => (
            <div key={String(l)} className="flex justify-between mb-1.5">
              <span className="od-key">{String(l)}</span>
              <span className="od-val">{String(v)}</span>
            </div>
          ))}
          {typeof order?.customer_notes === "string" && order.customer_notes && (
            <p className="mt-2 text-xs od-muted" style={{ background: "var(--bg4)", borderRadius: 6, padding: "8px 10px" }}>
              {order.customer_notes}
            </p>
          )}
        </div>
      </div>

      {/* ── Files ── */}
      <div className="od-card">
        <p className="od-sec-title">Uploaded Files</p>
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id as string} className="flex items-center justify-between gap-3 py-2"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <p className="od-val">{FILE_TYPE_LABELS[f.file_type as keyof typeof FILE_TYPE_LABELS]}</p>
                <p className="od-key text-xs truncate">{f.original_name as string} · {formatFileSize(f.file_size_bytes as number | null)}</p>
              </div>
              <a href={`/api/files/${f.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline shrink-0" style={{ color: "var(--p3)" }}>
                <FileDown className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Component Sourcing ── */}
      {sourcing && (
        <div className="od-card">
          <p className="od-sec-title">Component Sourcing</p>
          <div className="space-y-1">
            <p><span className="od-key">Option: </span>
              <span className="od-val capitalize">{(sourcing.sourcing_option as string).replace("_", " ")}</span></p>
            {sourcing.sourcing_option === "protonest" && (
              <p><span className="od-key">Allow equivalents: </span>
                <span className="od-val">{sourcing.allow_equivalents ? "Yes" : "No"}</span></p>
            )}
            {typeof sourcing.customer_supplied_note === "string" && sourcing.customer_supplied_note && (
              <p><span className="od-key">Notes: </span><span className="od-val">{sourcing.customer_supplied_note}</span></p>
            )}
            {typeof sourcing.expected_arrival === "string" && sourcing.expected_arrival && (
              <p><span className="od-key">Expected arrival: </span><span className="od-val">{formatDate(sourcing.expected_arrival)}</span></p>
            )}
          </div>
        </div>
      )}

      {/* ── Payments ── */}
      {payments.length > 0 && (
        <div className="od-card">
          <p className="od-sec-title">Payment</p>
          {payments.map((p) => (
            <div key={p.id as string} className="flex flex-wrap gap-4">
              <span><span className="od-key">Gateway: </span><span className="od-val capitalize">{(p.gateway as string).replace("_", " ")}</span></span>
              <span><span className="od-key">Amount: </span><span className="od-val">{formatLKR(p.amount_lkr as number)}</span></span>
              <span><span className="od-key">Status: </span>
                <span className="od-val" style={{ color: p.status === "completed" ? "var(--success)" : "var(--warning)" }}>
                  {p.status as string}
                </span>
              </span>
              {typeof p.gateway_reference === "string" && p.gateway_reference && (
                <span><span className="od-key">Ref: </span><span className="od-val font-mono">{p.gateway_reference}</span></span>
              )}
            </div>
          ))}
          {pendingBankTransfer && order?.status === "quote_ready" && (
            <div className="od-warn-inline">
              <p className="od-warn-text">Customer selected bank transfer. Confirm once funds are received.</p>
              {paymentMsg && (
                <p className={paymentMsg.startsWith("Error") ? "od-msg-err" : "od-msg-ok"} style={{ marginTop: 6 }}>
                  {paymentMsg}
                </p>
              )}
              <button onClick={confirmBankTransfer} disabled={confirmingPayment} className={`od-btn od-btn-success ${confirmingPayment ? "od-btn--loading" : ""}`}>
                {confirmingPayment
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
                  : <><Banknote className="w-4 h-4" /> Confirm Bank Transfer</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Reorder Discount Token ── */}
      {order?.status === "delivered" && (
        <div className="od-card">
          <p className="od-sec-title"><Gift className="w-3.5 h-3.5" /> Reorder Discount Token</p>
          {discountTokens.length > 0 ? (
            <div className="od-token-card">
              <p className="od-token-code">{discountTokens[0].token_code as string}</p>
              <p className="od-token-sub">
                {(discountTokens[0].discount_type as string) === "fixed"
                  ? formatLKR(discountTokens[0].discount_value as number)
                  : `${discountTokens[0].discount_value}%`} off · valid until {formatDate(discountTokens[0].valid_until as string)}
                {discountTokens[0].used ? " · Used" : ""}
              </p>
            </div>
          ) : (
            <>
              <p className="od-muted mb-4">Issue a one-time reorder code for this customer.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="od-lbl">Type</label>
                  <select value={tokenType} onChange={(e) => setTokenType(e.target.value as "fixed" | "percentage")}
                    className="od-inp">
                    <option value="fixed">Fixed (LKR)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="od-lbl">Value</label>
                  <input type="number" value={tokenValue} onChange={(e) => setTokenValue(e.target.value)}
                    min={1} className="od-inp" />
                </div>
                <div>
                  <label className="od-lbl">Valid (days)</label>
                  <input type="number" value={tokenDays} onChange={(e) => setTokenDays(e.target.value)}
                    min={1} max={365} className="od-inp" />
                </div>
              </div>
              {tokenMsg && <p className={tokenMsg.startsWith("Error") ? "od-msg-err" : "od-msg-ok"}>{tokenMsg}</p>}
              <button onClick={issueDiscountToken} disabled={issuingToken} className={`od-btn od-btn-primary ${issuingToken ? "od-btn--loading" : ""}`}>
                {issuingToken ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing…</> : <><Gift className="w-4 h-4" /> Issue Reorder Token</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Quote Section ── */}
      <div className="od-card">
        <p className="od-sec-title">{quotes.length > 0 ? "Quote (Revise)" : "Create Quote"}</p>
        {quotes.length > 0 && (
          <div className="od-success-inline">
            <p className="od-success-title">Current quote: {formatLKR((quotes[quotes.length - 1].amount_lkr as number))}</p>
            <p className="od-success-sub">
              Valid until: {formatDateTime(quotes[quotes.length - 1].valid_until as string)} · Status: {quotes[quotes.length - 1].status as string}
            </p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="od-lbl">Amount (LKR) *</label>
            <input type="number" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="e.g. 25000" min={1} className="od-inp" />
          </div>
          <div>
            <label className="od-lbl">Valid for (days)</label>
            <input type="number" value={quoteDays} onChange={(e) => setQuoteDays(e.target.value)}
              min={1} max={30} className="od-inp" />
          </div>
          <div className="sm:col-span-2">
            <label className="od-lbl">Notes for customer <span className="od-key font-normal">(visible to customer)</span></label>
            <textarea value={quoteCustomerNotes} onChange={(e) => setQuoteCustomerNotes(e.target.value)}
              rows={2} maxLength={1000}
              placeholder="Component notes, lead time details, any special instructions for the customer…"
              className="od-inp resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="od-lbl">
              Internal notes <span style={{ color: "var(--warning)", fontWeight: 400 }}>(admin only — NEVER shown to customer)</span>
            </label>
            <textarea value={quoteAdminNotes} onChange={(e) => setQuoteAdminNotes(e.target.value)}
              rows={2} maxLength={2000}
              placeholder="Supplier costs, markup notes, internal calculations…"
              className="od-inp od-inp-danger resize-none" />
          </div>
        </div>
        {quoteMsg && <p className={quoteMsg.startsWith("Error") ? "od-msg-err" : "od-msg-ok"}>{quoteMsg}</p>}
        <button onClick={saveQuote} disabled={savingQuote || !quoteAmount} className={`od-btn od-btn-primary ${savingQuote ? "od-btn--loading" : ""}`}>
          {savingQuote ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Send className="w-4 h-4" /> Save &amp; Notify Customer</>}
        </button>
      </div>

      {/* ── Status Control ── */}
      <div className="od-card">
        <p className="od-sec-title">Update Status</p>
        {nextStatuses.length === 0 ? (
          <p className="od-msg-ok" style={{ marginBottom: 0 }}>
            ✓ Order is at its final status ({order?.status as string}). No further status updates are available.
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="od-lbl">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)} className="od-inp">
                  <option value="">— Select next status —</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_STEPS.find((step) => step.status === s)?.label ?? s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="od-lbl">Expected Delivery Date (optional)</label>
                <input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="od-inp" />
              </div>
              <div className="sm:col-span-2">
                <label className="od-lbl">Note (optional)</label>
                <input type="text" value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Reason or note for this status change…" maxLength={500}
                  className="od-inp" />
              </div>
            </div>
            {statusMsg && <p className={statusMsg.startsWith("Error") ? "od-msg-err" : "od-msg-ok"}>{statusMsg}</p>}
            <button onClick={updateStatus} disabled={updatingStatus || !newStatus} className={`od-btn od-btn-success ${updatingStatus ? "od-btn--loading" : ""}`}>
              {updatingStatus ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : <><ChevronRight className="w-4 h-4" /> Update Status &amp; Notify</>}
            </button>
          </>
        )}
      </div>

      {/* ── Admin Notes ── */}
      <div className="od-warn-card">
        <p className="od-sec-title" style={{ color: "var(--warning)" }}>
          Internal Notes <span style={{ textTransform: "none", fontWeight: 400, color: "var(--text3)" }}>(admin only — never shown to customer)</span>
        </p>
        <div className="space-y-2 mb-4">
          {adminNotes.length === 0 && <p className="od-key text-xs">No internal notes yet.</p>}
          {adminNotes.map((n) => (
            <div key={n.id as string} className="od-note-item">
              <p className="od-val text-sm">{n.note_text as string}</p>
              <p className="od-key text-xs mt-1">
                {(n.profiles as Record<string, string>)?.full_name ?? "Admin"} · {formatDateTime(n.created_at as string)}
              </p>
            </div>
          ))}
        </div>
        <div className="od-note-row">
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
            rows={2} maxLength={500} placeholder="Add an internal note…"
            className="od-inp flex-1 resize-none" />
          <button onClick={saveNote} disabled={savingNote || !noteText.trim()}
            className={`od-btn od-btn-warn od-note-btn ${savingNote ? "od-btn--loading" : ""}`} style={{ marginTop: 0 }}>
            {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
        {noteMsg && (
          <p className={noteMsg.startsWith("Error") ? "od-msg-err" : "od-msg-ok"} style={{ marginTop: 6 }}>
            {noteMsg}
          </p>
        )}
      </div>

      {/* ── Status History ── */}
      <div className="od-card">
        <p className="od-sec-title">Status History</p>
        <div className="space-y-3">
          {statusHistory.length === 0 && <p className="od-key text-xs">No history yet.</p>}
          {statusHistory.map((h) => (
            <div key={h.id as string} className="flex items-start gap-3">
              <div className="od-history-dot" />
              <div>
                <span className="od-val text-sm">
                  {h.old_status ? `${h.old_status} → ` : ""}{h.new_status as string}
                </span>
                {typeof h.note === "string" && h.note && <span className="od-muted"> — {h.note}</span>}
                <p className="od-key text-xs mt-0.5">
                  {(h.profiles as Record<string, string>)?.full_name ?? "System"} · {formatDateTime(h.changed_at as string)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
