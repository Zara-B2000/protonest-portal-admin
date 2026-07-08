import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminProfile } from "@/services/auth";

const FEATURES = [
  {
    title: "Order Pipeline",
    desc: "Track every job from quote request through inspection to delivery across an 8-stage pipeline.",
  },
  {
    title: "Quotes & Payments",
    desc: "Review incoming requests, issue quotes, and confirm bank-transfer or gateway payments in one place.",
  },
  {
    title: "Customer Messaging",
    desc: "Reply to customer conversations and keep order-specific context without leaving the dashboard.",
  },
  {
    title: "Team & Access",
    desc: "Manage admin accounts, roles, and portal-wide settings from a single control panel.",
  },
];

export default async function AdminGatePage() {
  // If already signed in as admin, skip the landing page entirely.
  const profile = await getCurrentProfile({ create: false });
  if (profile && isAdminProfile(profile)) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#05060F] text-white relative overflow-hidden">
      {/* Decorative background, consistent with the sign-in screen */}
      <div className="pn-auth-page-bg" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,71,245,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(99,71,245,0.035) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="pointer-events-none fixed z-0"
        style={{
          width: 700,
          height: 700,
          background: "radial-gradient(circle,rgba(99,71,245,0.13) 0%,transparent 65%)",
          top: "-10%",
          right: "-10%",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <img src="/protonest-logo.png" alt="Protonest" className="h-8 w-auto" />
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-slate-400 border border-white/10 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Internal Admin Portal
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-[#9D82F8] mb-4 uppercase">
            Protonest Operations
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Admin Portal
          </h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
            The staff-only control center for Protonest PCB assembly orders —
            quotes, production status, payments, and customer communication,
            all in one place. Customer ordering now happens on our{" "}
            <span className="text-slate-300">customer portal</span>.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="pn-btn-primary">
              Sign In to Admin Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 border-t border-white/10 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-xl font-semibold text-white mb-8">
            Built for the Protonest team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#7B5CF6]/40 transition-colors"
              >
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Protonest Technologies. Access restricted to authorized staff.</span>
          <Link href="/login" className="text-slate-400 hover:text-[#9D82F8] transition-colors">
            Admin Sign In &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}
