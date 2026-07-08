import { Resend } from "resend";
import type { OrderStatus } from "@/types";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey && apiKey !== "re_your-resend-api-key" ? new Resend(apiKey) : null;
const FROM = `${process.env.RESEND_FROM_NAME ?? "Protonest"} <${process.env.RESEND_FROM_EMAIL ?? "orders@protonest.lk"}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
// This admin portal no longer serves customers directly — customer-facing
// links (order tracking, payment, reordering) must point to the separate
// customer portal. Falls back to APP_URL if not configured.
const CUSTOMER_PORTAL_URL = process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? APP_URL;

function getAdminEmail(): string {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  return adminEmails[0] ?? process.env.RESEND_FROM_EMAIL ?? "orders@protonest.lk";
}

function getAllAdminEmails(): string[] {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return emails.length > 0 ? emails : [process.env.RESEND_FROM_EMAIL ?? "orders@protonest.lk"];
}

export interface EmailContext {
  to: string;
  customerName: string;
  orderNumber: string;
  projectName: string;
  orderId: string;
}

// ── HTML email helper ─────────────────────────────────────────────────────────
function baseEmail(title: string, body: string): string {
  const adminEmail = getAdminEmail();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:Arial,sans-serif;font-size: 0.9375rem;color:#1F2D3D">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <tr>
            <td style="background:#1A3C5E;padding:28px 36px">
              <h1 style="margin:0;color:#FFFFFF;font-size: 1.5rem;letter-spacing:-0.3px">Protonest PCB Assembly</h1>
              <p style="margin:6px 0 0;color:#D5E8F0;font-size: 0.8125rem">Small-batch assembly in Sri Lanka</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px">
              <h2 style="margin:0 0 16px;color:#1A3C5E;font-size: 1.25rem">${title}</h2>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;background:#F5F7FA;border-top:1px solid #E2E8F0">
              <p style="margin:0;font-size: 0.8125rem;color:#5A7A9A">
                Questions? Call or WhatsApp us at <strong>+94 XX XXX XXXX</strong> or reply to this email at <a href="mailto:${adminEmail}" style="color:#2E75B6;text-decoration:none"><strong>${adminEmail}</strong></a>.<br />
                <a href="${CUSTOMER_PORTAL_URL}" style="color:#2E75B6;text-decoration:none">protonest.lk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function orderLink(orderId: string): string {
  return `${CUSTOMER_PORTAL_URL}/orders/${orderId}`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#2E75B6;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;font-size: 0.9375rem">${text}</a>`;
}

function orderIdBadge(orderNumber: string): string {
  return `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px 20px;margin:16px 0">
    <p style="margin:0;font-size: 0.75rem;color:#5A7A9A;text-transform:uppercase;letter-spacing:0.5px">Your Order ID</p>
    <p style="margin:6px 0 0;font-size: 1.75rem;font-weight:bold;color:#1A3C5E;letter-spacing:1px">${orderNumber}</p>
    <p style="margin:4px 0 0;font-size: 0.75rem;color:#5A7A9A">Keep this number for all future communications</p>
  </div>`;
}

// ── Email templates by event ─────────────────────────────────────────────────

export async function sendOrderConfirmation(ctx: EmailContext) {
  const body = `
    <p>Hi ${ctx.customerName},</p>
    <p>Your PCB assembly order has been received successfully. Our team will review your files and send you a quote within <strong>24 hours</strong>.</p>
    ${orderIdBadge(ctx.orderNumber)}
    <p><strong>Project:</strong> ${ctx.projectName}</p>
    <p>You can track your order at any time using the link below.</p>
    ${ctaButton("Track My Order", orderLink(ctx.orderId))}
    <p style="margin-top:24px;font-size: 0.8125rem;color:#5A7A9A">If you have not received a quote within 24 hours, please contact us directly.</p>
  `;
  return sendEmail(ctx.to, `Order Received — ${ctx.orderNumber}`, baseEmail("Order Received!", body));
}

export async function sendQuoteReady(
  ctx: EmailContext,
  amountLkr: number,
  validUntil: string,
  customerNotes?: string
) {
  const body = `
    <p>Hi ${ctx.customerName},</p>
    <p>Your quote for order <strong>${ctx.orderNumber}</strong> is ready!</p>
    ${orderIdBadge(ctx.orderNumber)}
    <p><strong>Quoted Amount:</strong> LKR ${amountLkr.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</p>
    <p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString("en-LK", { dateStyle: "long" })}</p>
    ${customerNotes ? `<p><strong>Notes from Protonest:</strong><br/>${customerNotes}</p>` : ""}
    <p>Click below to review and accept the quote to proceed with payment.</p>
    ${ctaButton("Review & Pay Now", orderLink(ctx.orderId))}
    <p style="margin-top:16px;font-size: 0.8125rem;color:#dc2626">⚠ This quote expires on ${new Date(validUntil).toLocaleDateString("en-LK")}. Please complete payment before then.</p>
  `;
  return sendEmail(ctx.to, `Quote Ready — ${ctx.orderNumber} — LKR ${amountLkr.toLocaleString()}`, baseEmail("Your Quote is Ready", body));
}

export async function sendPaymentConfirmation(ctx: EmailContext, amountLkr: number) {
  const body = `
    <p>Hi ${ctx.customerName},</p>
    <p>Your payment has been received and verified for order <strong>${ctx.orderNumber}</strong>.</p>
    ${orderIdBadge(ctx.orderNumber)}
    <p><strong>Amount Paid:</strong> LKR ${amountLkr.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</p>
    <p>We will now begin sourcing components. You will receive an update when they arrive and again when assembly begins.</p>
    <p><strong>Estimated delivery:</strong> 10–15 business days from today.</p>
    ${ctaButton("Track My Order", orderLink(ctx.orderId))}
  `;
  return sendEmail(ctx.to, `Payment Confirmed — ${ctx.orderNumber}`, baseEmail("Payment Received!", body));
}

export async function sendStatusUpdate(
  ctx: EmailContext,
  status: OrderStatus,
  extraHtml?: string
) {
  const statusMessages: Partial<Record<OrderStatus, { subject: string; heading: string; body: string }>> = {
    components_received: {
      subject: `Components Received — ${ctx.orderNumber}`,
      heading: "Components Received",
      body: "All components for your order have arrived. We will begin assembly shortly.",
    },
    in_assembly: {
      subject: `Assembly Started — ${ctx.orderNumber}`,
      heading: "Assembly in Progress",
      body: "Your PCBs are now on the assembly line. We will notify you when inspection is complete.",
    },
    inspection: {
      subject: `Quality Inspection — ${ctx.orderNumber}`,
      heading: "Inspection in Progress",
      body: "Assembly is complete. Your boards are currently undergoing quality inspection.",
    },
    ready_for_delivery: {
      subject: `Ready for Delivery — ${ctx.orderNumber}`,
      heading: "Your Order is Ready!",
      body: "Your assembled PCBs have passed inspection and are packed and ready to ship. We will contact you to coordinate delivery.",
    },
    delivered: {
      subject: `Delivered — ${ctx.orderNumber}`,
      heading: "Order Delivered",
      body: "Your order has been delivered. Thank you for choosing Protonest! We hope your project is a success.",
    },
  };

  const tpl = statusMessages[status];
  if (!tpl) return;

  const body = `
    <p>Hi ${ctx.customerName},</p>
    <p>${tpl.body}</p>
    ${orderIdBadge(ctx.orderNumber)}
    ${extraHtml ?? ""}
    ${ctaButton("View Order", orderLink(ctx.orderId))}
  `;
  return sendEmail(ctx.to, tpl.subject, baseEmail(tpl.heading, body));
}

export async function sendDiscountToken(
  ctx: EmailContext,
  tokenCode: string,
  discountType: "fixed" | "percentage",
  discountValue: number,
  validUntil: string
) {
  const discountLabel =
    discountType === "fixed"
      ? `LKR ${discountValue.toLocaleString("en-LK", { minimumFractionDigits: 2 })} off your next order`
      : `${discountValue}% off your next order`;

  const body = `
    <p>Hi ${ctx.customerName},</p>
    <p>Thank you for your order <strong>${ctx.orderNumber}</strong>. As a returning customer, here is your reorder discount:</p>
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
      <p style="margin:0;font-size: 0.75rem;color:#5A7A9A;text-transform:uppercase;letter-spacing:0.5px">Your Discount Code</p>
      <p style="margin:8px 0 0;font-size: 2rem;font-weight:bold;color:#1A3C5E;letter-spacing:2px;font-family:monospace">${tokenCode}</p>
      <p style="margin:8px 0 0;font-size: 0.875rem;color:#1F2D3D">${discountLabel}</p>
      <p style="margin:8px 0 0;font-size: 0.75rem;color:#5A7A9A">Valid until ${new Date(validUntil).toLocaleDateString("en-LK")}</p>
    </div>
    <p>Enter this code when placing your next order (Step 1 — Order Details).</p>
    ${ctaButton("Place a New Order", `${CUSTOMER_PORTAL_URL}/orders/new`)}
  `;
  return sendEmail(ctx.to, `Reorder Discount — ${ctx.orderNumber}`, baseEmail("Your Reorder Discount", body));
}

export async function sendAdminNewOrder(ctx: EmailContext & {
  customerEmail: string;
  units: number;
  assemblyType: string;
  company?: string | null;
}) {
  const adminEmails = getAllAdminEmails();
  const adminPanelLink = `${APP_URL}/admin/orders/${ctx.orderId}`;

  const assemblyLabel: Record<string, string> = {
    smt_only: "SMT Only",
    through_hole_only: "Through-Hole Only",
    mixed: "Mixed (SMT + Through-Hole)",
  };

  const body = `
    <p>A new PCB assembly order has been submitted and is waiting for your quote.</p>
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px 20px;margin:16px 0">
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:0.9375rem">
        <tr><td style="padding:4px 0;color:#5A7A9A;width:140px">Order ID</td><td style="padding:4px 0;font-weight:bold;color:#1A3C5E">${ctx.orderNumber}</td></tr>
        <tr><td style="padding:4px 0;color:#5A7A9A">Project</td><td style="padding:4px 0;color:#1F2D3D">${ctx.projectName}</td></tr>
        <tr><td style="padding:4px 0;color:#5A7A9A">Customer</td><td style="padding:4px 0;color:#1F2D3D">${ctx.customerName}${ctx.company ? ` · ${ctx.company}` : ""}</td></tr>
        <tr><td style="padding:4px 0;color:#5A7A9A">Email</td><td style="padding:4px 0"><a href="mailto:${ctx.customerEmail}" style="color:#2E75B6">${ctx.customerEmail}</a></td></tr>
        <tr><td style="padding:4px 0;color:#5A7A9A">Units</td><td style="padding:4px 0;color:#1F2D3D">${ctx.units}</td></tr>
        <tr><td style="padding:4px 0;color:#5A7A9A">Assembly Type</td><td style="padding:4px 0;color:#1F2D3D">${assemblyLabel[ctx.assemblyType] ?? ctx.assemblyType}</td></tr>
      </table>
    </div>
    <p>Log in to the admin panel to review the order files and create a quote.</p>
    ${ctaButton("Review Order & Create Quote", adminPanelLink)}
  `;

  const results = await Promise.all(
    adminEmails.map((adminTo) =>
      sendEmail(adminTo, `New Order — ${ctx.orderNumber} from ${ctx.customerName}`, baseEmail("New Order Received", body))
    )
  );
  return results[0];
}

// ── Core send function ────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const adminEmail = getAdminEmail();

  if (!resend) {
    console.log(`
========================================
[Email STUB] ✉️ Sending Email Notification
========================================
From:      ${FROM}
To:        ${to}
Reply-To:  ${adminEmail}
Subject:   ${subject}
----------------------------------------
Body:
${html}
========================================
`);
    return { success: true, id: "stubbed-id" };
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      replyTo: adminEmail,
    });
    return { success: true, id: result.data?.id };
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return { success: false, error: String(err) };
  }
}
