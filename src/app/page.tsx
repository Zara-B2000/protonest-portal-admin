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
    <div className="min-h-screen text-slate-900 dark:text-white relative overflow-hidden bg-slate-50 dark:bg-[#05060F]">
      {/* Decorative background, consistent with the sign-in screen */}
      <div className="pn-auth-page-bg" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,71,245,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,71,245,0.03) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="pointer-events-none fixed z-0"
        style={{
          width: 700,
          height: 700,
          background: "radial-gradient(circle,rgba(99,71,245,0.12) 0%,transparent 65%)",
          top: "-10%",
          right: "-10%",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <img src="/protonest-logo.png" alt="Protonest" className="h-8 w-auto" />
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1 bg-white/50 dark:bg-transparent backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Internal Admin Portal
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-16 md:pt-16 md:pb-20">
        <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md overflow-hidden p-8 md:p-12 shadow-xl dark:shadow-none">
          {/* Video / Fallback image background */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/pcb-hand-soldering.png"
              className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.22] mix-blend-luminosity"
            >
              <source src="/pcb-soldering.mp4" type="video/mp4" />
            </video>
            {/* Ambient overlay to ensure contrast and readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent dark:from-[#05060F] dark:via-[#05060F]/80 dark:to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-brand-500 dark:text-[#9D82F8] mb-4 uppercase">
              Protonest Operations
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-slate-900 dark:text-white">
              Admin <span className="bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-[#9D82F8] dark:to-[#C4B5FD] bg-clip-text text-transparent">Portal</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10 max-w-xl">
              The staff-only control center for Protonest PCB assembly orders —
              quotes, production status, payments, and customer communication,
              all in one place. Customer ordering now happens on our{" "}
              <span className="text-slate-950 dark:text-slate-300 font-semibold">customer portal</span>.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/login" className="pn-btn-primary">
                Sign In to Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8">
            Built for the Protonest team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 hover:border-brand-500/40 dark:hover:border-[#7B5CF6]/40 hover:shadow-lg dark:hover:shadow-none hover:shadow-brand-500/5 transition-all duration-300"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-transparent">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>&copy; {new Date().getFullYear()} Protonest Technologies. Access restricted to authorized staff.</span>
          <Link href="/login" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-[#9D82F8] transition-colors font-medium">
            Admin Sign In &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}
