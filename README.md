# Protonest Admin Portal

Staff-only admin portal for Protonest's PCB assembly business. Admins review incoming orders, issue quotes, confirm payments, track production through every stage, message customers, and manage portal settings and staff accounts.

> **Note:** This app no longer has a customer-facing section. Customers place orders and track them on the separate customer portal; this app is for Protonest staff only. Admin accounts are granted via the `ADMIN_EMAILS` environment variable (auto-promoted on first login) or by an existing admin toggling a user's role on the Users page.

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine for dev) — handles authentication and database
- A [Resend](https://resend.com) account (free tier: 3,000 emails/month)
- A [PayHere](https://www.payhere.lk) merchant account (use sandbox for dev)

### 1. Clone and install

```bash
git clone <your-repo-url> protonest-portal
cd protonest-portal
npm install
```

### 2. Install shadcn/ui components

```bash
npm run setup:shadcn
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your actual values. See `.env.example` for all required variables. **Never commit `.env.local`.**

For Supabase auth, enable the sign-in providers you want in the Supabase Dashboard → Authentication → Providers. Email/password is enabled by default.

### 4. Set up the database

In your Supabase project → SQL Editor, run these migrations in order:

```sql
-- Paste the contents of supabase/migrations/001_schema.sql
-- Paste the contents of supabase/migrations/002_grants.sql
-- Paste the contents of supabase/migrations/003_clerk_profiles.sql  (legacy name — sets up profile UUID defaults)
-- Paste the contents of supabase/migrations/004_messages.sql
```

Then create the storage bucket:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', false);
```

Files are uploaded and signed from server routes using the Supabase service role key.

### 5. Create your admin user

Set `ADMIN_EMAILS` in `.env.local`, for example:

```env
ADMIN_EMAILS=owner@protonest.lk,ops@protonest.lk
```

When one of those emails signs in through Supabase for the first time, the app creates a `profiles` row with the `admin` role.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Admin portal landing page
│   ├── (auth)/                   # Login, forgot-password, verify-otp (staff sign-in only)
│   ├── (admin)/                  # Admin dashboard, order management, messages, settings, users
│   └── api/
│       ├── auth/                 # Supabase auth callback + signout
│       ├── orders/               # Order CRUD, status updates
│       ├── quotes/                # Quote creation (admin)
│       ├── files/                # Signed file download URLs
│       ├── messages/             # Admin messaging with customers
│       └── admin/                # Admin-only order + notes APIs
├── components/
│   ├── shared/                   # StatusTimeline, OrderStatusBadge, SignOutButton, etc.
│   ├── admin/                    # AdminSidebar, SidebarToggle, SettingsPage
│   ├── chat/                     # AdminMessagesPanel
│   └── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
├── services/
│   ├── auth/                     # Profile creation + role resolution
│   ├── supabase/                 # Browser + server + service-role clients
│   └── notifications/            # Email (Resend) + SMS (Ideamart) + orchestrator
├── schemas/
│   └── index.ts                  # Zod validation schemas
├── hooks/
│   └── use-toast.ts
├── utils/
│   └── index.ts                  # Formatters, helpers, cn()
└── types/
    └── index.ts                  # All TypeScript types + constants
middleware.ts                     # Supabase session refresh on every request
```

---

## Payment Integration

### PayHere (Primary)

- **Sandbox URL:** `https://sandbox.payhere.lk/pay/checkout`
- **Live URL:** `https://www.payhere.lk/pay/checkout`
- Set `PAYHERE_ENV=sandbox` in `.env.local` for development.

**Sandbox test cards:**

| Card Type  | Number               |
|------------|----------------------|
| Visa       | 4916217501611292     |
| MasterCard | 5307732125531191     |
| Amex       | 346781005510225      |

Any valid name, CVV, and future expiry date work in sandbox.

**Critical IPN rule:** The `notify_url` must be a publicly reachable HTTPS URL. For local development, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Then set NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.app
```

**Required sandbox tests before going live:**
1. ✅ Successful payment — order status moves to `payment_completed`
2. ✅ Failed/cancelled payment — order stays in `quote_ready`
3. ✅ Duplicate IPN callback — status updated only once
4. ✅ Tampered amount — hash check rejects, order unchanged

### Bank Transfer (Fallback)

Admin manually marks payment received in the admin order detail page.

---

## Notifications

### Email — Resend

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env.local`. Free tier supports 3,000 emails/month.

### SMS — Dialog Ideamart

Set `SMS_ENABLED=true` and `IDEAMART_APP_ID` / `IDEAMART_PASSWORD` to enable real SMS. Set `SMS_ENABLED=false` (default) to stub SMS and only log to console — safe for development.

### Notification triggers

| Event                | Email | SMS  |
|----------------------|-------|------|
| Order submitted      | ✅    | ✅   |
| Quote ready          | ✅    | ✅   |
| Payment confirmed    | ✅    | ✅   |
| Components received  | ✅    | —    |
| In assembly          | ✅    | —    |
| Inspection           | ✅    | —    |
| Ready for delivery   | ✅    | ✅   |
| Delivered            | ✅    | —    |

---

## Security Controls

| Control                        | Implementation                                        |
|--------------------------------|-------------------------------------------------------|
| Auth                           | Supabase Auth — email/password and social sign-in     |
| Route protection               | Next.js middleware refreshes session; layouts enforce auth |
| Admin role enforcement         | Server-side role check in every admin API route       |
| Customer data isolation        | Server-side Supabase profile checks + scoped queries  |
| Admin notes privacy            | Never returned by customer-facing API endpoints       |
| Private file storage           | Supabase private bucket — access via signed URLs only |
| PayHere IPN verification       | MD5 hash verified server-side before any DB update    |
| Idempotent IPN callbacks       | Duplicate callbacks detected and ignored              |
| Amount tamper protection       | IPN amount vs stored quote amount compared server-side|
| No secrets in browser          | Service role key only used in server-side API routes  |
| Input validation               | Zod schemas on every API route                        |
| Safe error messages            | No stack traces or secrets in API error responses     |

---

## Testing Checklist

Before going live, verify every item:

### Authentication
- [ ] Signup with valid email + password
- [ ] Email OTP verification works (check `/verify-otp` flow)
- [ ] Login and logout
- [ ] Unauthenticated access to `/dashboard` redirects to `/login`
- [ ] Non-admin access to `/admin/*` redirects to `/dashboard`

### Order Submission
- [ ] All 4 steps complete successfully
- [ ] Units above 20 blocked
- [ ] Missing required file blocks submission
- [ ] Wrong file type rejected with clear message
- [ ] File above size limit rejected
- [ ] Order appears in dashboard after submission
- [ ] Confirmation email received

### Admin Workflow
- [ ] Admin can see all orders in dashboard panel
- [ ] Admin can create quote and it notifies customer
- [ ] Admin can update status — history logged
- [ ] Admin notes never visible in customer view
- [ ] Customer cannot reach `/admin/*` routes

### Payment
- [ ] PayHere sandbox successful payment — status → `payment_completed`
- [ ] PayHere sandbox failed payment — status unchanged
- [ ] Duplicate IPN sent twice — processed only once
- [ ] Tampered amount in IPN — rejected, no status change
- [ ] Bank transfer flow records payment as pending

### File Access
- [ ] Customer can download their own files
- [ ] Customer cannot access another customer's file by guessing ID
- [ ] Signed URL expires after configured time

### Customer Isolation
- [ ] Changing order ID in URL shows 404 for another customer's order

---

## Deployment

### Environment variables for production

Copy all variables from `.env.example` to your hosting provider's environment config.

**Critical production checklist:**
- [ ] `PAYHERE_ENV=live` — only after all sandbox tests pass
- [ ] `NEXT_PUBLIC_APP_URL` set to your production domain (HTTPS)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set but never logged or exposed
- [ ] `SMS_ENABLED=true` — only after Dialog Ideamart account is active
- [ ] Run `npm run build` locally before deploying to catch type errors

### Recommended: Vercel + Supabase

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

---

## Known Limitations (MVP)

- Maximum 20 units per order. Larger runs require direct contact.
- Quote is manual — no instant automated pricing.
- No live LCSC/DigiKey stock checking — admin confirms availability.
- WhatsApp notifications not yet integrated (post-MVP).
- No customer analytics or admin reporting exports (post-MVP).
- WEBXPAY not integrated — bank transfer is the only non-PayHere fallback.

---

## Post-MVP Roadmap

1. WhatsApp Business API notifications
2. Instant quote calculator (component cost API integration)
3. Admin reporting and CSV export
4. Multi-level admin roles (viewer / editor / super-admin)
5. Customer order feedback system
6. Live DigiKey/LCSC stock check during order submission
7. Bulk order import

---

## Support

Questions about the code? Contact the project author.  
Customer-facing support: WhatsApp or call **+94 XX XXX XXXX**
