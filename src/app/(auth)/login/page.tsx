"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/services/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getRedirectPath(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "/login";
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  // This portal is admin-only — non-admin accounts (e.g. customers from the
  // separate customer portal) are not allowed in, even if they authenticate
  // successfully. Returning null signals "deny access" to the caller.
  return profile?.role === "admin" ? "/admin/dashboard" : null;
}

// Spinner SVG — reused in both buttons
function Spinner({ color = "white" }: { color?: string }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      style={{ animation: "pn-spin 0.75s linear infinite", flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke={color === "white" ? "rgba(255,255,255,0.22)" : "rgba(107,78,255,0.22)"} strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color === "white" ? "#fff" : "#7B5CF6"} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function LoginContent() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingType, setLoadingType]   = useState<"email" | "google" | null>(null);
  const [loadingStep, setLoadingStep]   = useState<string>("");
  const [error, setError]           = useState<string | null>(null);

  const loading = loadingType !== null;
  const router  = useRouter();
  const searchParams = useSearchParams();
  const successMsg = searchParams.get("message") === "registration-success"
    ? "Registration successful! Please sign in below."
    : null;
  const urlError = searchParams.get("error");
  const urlErrorMsg =
    urlError === "not-admin"
      ? "This portal is for Protonest staff only. Your account doesn't have admin access."
      : urlError === "auth-callback-failed"
      ? "Sign-in failed. Please try again."
      : null;
  const supabase = createClient();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoadingType("email");
    setLoadingStep("Authenticating…");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoadingType(null);
        setLoadingStep("");
        return;
      }

      setLoadingStep("Verifying access…");
      const dest = await getRedirectPath(supabase);

      if (!dest) {
        await supabase.auth.signOut();
        setError("This portal is for Protonest staff only. Your account doesn't have admin access.");
        setLoadingType(null);
        setLoadingStep("");
        return;
      }

      setLoadingStep("Redirecting…");
      router.push(dest);
      router.refresh();
      // Keep spinner — page navigates away naturally
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoadingType(null);
      setLoadingStep("");
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoadingType("google");
    setLoadingStep("Connecting to Google…");
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (googleError) {
        setError(googleError.message);
        setLoadingType(null);
        setLoadingStep("");
      }
      // On success browser redirects — spinner stays
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setLoadingType(null);
      setLoadingStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes pn-fade-up {
          from { opacity: 0; transform: translateY(24px) scale(0.975); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes pn-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pn-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes pn-pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pn-progress {
          0%   { width: 0%; }
          30%  { width: 45%; }
          60%  { width: 70%; }
          80%  { width: 85%; }
          100% { width: 95%; }
        }
        @keyframes pn-step-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pn-card { animation: pn-fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both; }

        .pn-input {
          width: 100%; height: 50px;
          background: #090C1A;
          border: 1px solid rgba(99,71,245,0.18);
          border-radius: 11px;
          padding: 0 44px 0 46px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.90625rem; color: #EDF0F8;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, opacity 0.2s;
        }
        .pn-input::placeholder { color: #4A5578; }
        .pn-input:focus {
          border-color: #7B5CF6;
          box-shadow: 0 0 0 3px rgba(99,71,245,0.15);
        }
        .pn-input:disabled { opacity: 0.55; cursor: not-allowed; }

        .icard:hover { border-color: rgba(99,71,245,0.35) !important; }

        /* Progress bar while authenticating */
        .pn-progress-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: rgba(107,78,255,0.12);
          overflow: hidden;
          border-radius: 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .pn-progress-bar.visible { opacity: 1; }
        .pn-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #7B5CF6, #C4B5FD, #7B5CF6);
          background-size: 200% 100%;
          animation: pn-progress 3.5s ease-out forwards, shimmer 1.5s linear infinite;
          border-radius: 0 2px 2px 0;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Step feedback pill */
        .pn-step-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 100px;
          background: rgba(107,78,255,0.08);
          border: 1px solid rgba(107,78,255,0.20);
          font-size: 0.78125rem;
          font-weight: 600;
          color: #9D82F8;
          margin-bottom: 18px;
          animation: pn-step-in 0.25s ease-out both;
        }
        .pn-step-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #7B5CF6;
          flex-shrink: 0;
          animation: pn-blink 1s ease-in-out infinite;
          box-shadow: 0 0 6px #7B5CF6;
        }

        /* Right panel responsive padding */
        .pn-auth-right-panel { padding: 50px 60px; }
        @media (max-width: 767px) {
          .pn-auth-right-panel { padding: 44px 32px; }
        }
        @media (max-width: 479px) {
          .pn-auth-right-panel { padding: 36px 20px; }
        }
      `}</style>

      {/* ── Background ── */}
      <div className="pn-auth-page-bg" />
      <div style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(99,71,245,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(99,71,245,0.035) 1px,transparent 1px)",
        backgroundSize:"44px 44px",
      }} />
      <div style={{ position:"fixed", zIndex:0, pointerEvents:"none", width:700, height:700, background:"radial-gradient(circle,rgba(99,71,245,0.13) 0%,transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-55%)" }} />
      <div style={{ position:"fixed", zIndex:0, pointerEvents:"none", width:400, height:400, background:"radial-gradient(circle,rgba(99,71,245,0.07) 0%,transparent 70%)", bottom:-80, right:"10%" }} />

      {/* ── Layout ── */}
      <div style={{ position:"relative", zIndex:1, height:"100vh", display:"flex", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
        <div className="pn-card pn-auth-container" style={{ position:"relative", display:"flex", width:"100%", height:"100%", overflow:"hidden" }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ flex:1, maxWidth:"46%", flexShrink:0, padding:"50px 44px 40px", flexDirection:"column", position:"relative", overflow:"hidden" }} className="hidden lg:flex pn-auth-left-panel">
            <div style={{ position:"absolute", top:18, left:18, width:22, height:22, borderTop:"1.5px solid rgba(123,92,246,0.3)", borderLeft:"1.5px solid rgba(123,92,246,0.3)", borderRadius:"2px 0 0 0" }} />
            <div style={{ position:"absolute", bottom:18, right:18, width:22, height:22, borderBottom:"1.5px solid rgba(123,92,246,0.3)", borderRight:"1.5px solid rgba(123,92,246,0.3)", borderRadius:"0 0 2px 0" }} />

            <div style={{ marginBottom:20 }}>
              <img src="/protonest-logo.png" alt="Protonest" style={{ height:48, width:"auto" }} />
            </div>

            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", width:"100%", margin:"24px 0" }}>
              <div style={{ width:"100%", aspectRatio:"1.77", position:"relative", borderRadius:14, border:"1px solid rgba(99,71,245,0.22)", overflow:"hidden", boxShadow:"0 10px 25px rgba(0,0,0,0.45),0 0 16px rgba(99,71,245,0.12)" }}>
                <img src="/pcb-industry-cover.jpg" alt="Protonest PCB Assembly" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(6,8,19,0.55) 0%,transparent 40%)", pointerEvents:"none" }} />
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginTop:12 }}>
              {[
                { label:"Min. Order", val:"5 pcs",   sub:"Small batch ready" },
                { label:"Turnaround", val:"7 days",  sub:"Express available" },
                { label:"Delivery",   val:"LK-wide", sub:"Sri Lanka" },
                { label:"Support",    val:"24/7",    sub:"Engineer assist" },
              ].map((c) => (
                <div key={c.label} className="icard" style={{ background:"rgba(99,71,245,0.04)", border:"1px solid rgba(99,71,245,0.12)", borderRadius:10, padding:"11px 14px", transition:"border-color 0.2s" }}>
                  <div style={{ fontSize:"0.59375rem", fontWeight:600, color:"#475569", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>{c.label}</div>
                  <div className="pn-auth-card-val">{c.val}</div>
                  <div style={{ fontSize:"0.65625rem", color:"#475569", marginTop:2 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:24, fontSize:"0.75rem", color:"#64748B" }}>
              <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 8px #10B981" }} />
              <span>System Online</span>
              <span style={{ color:"#334155" }}>·</span>
              <span>🇱🇰 Sri Lanka Portal</span>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="pn-auth-right-panel" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", position:"relative" }}>

            {/* Progress bar — visible during any loading */}
            <div className={`pn-progress-bar ${loading ? "visible" : ""}`}>
              {loading && <div className="pn-progress-bar-fill" />}
            </div>

            <div style={{ position:"absolute", top:0, right:0, width:320, height:320, background:"radial-gradient(circle,rgba(99,71,245,0.06) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
            <div style={{ position:"absolute", top:18, right:18, width:18, height:18, borderTop:"1.5px solid rgba(99,71,245,0.18)", borderRight:"1.5px solid rgba(99,71,245,0.18)" }} />
            <div style={{ position:"absolute", bottom:18, left:18, width:18, height:18, borderBottom:"1.5px solid rgba(99,71,245,0.18)", borderLeft:"1.5px solid rgba(99,71,245,0.18)" }} />

            <div style={{ position:"absolute", top:24, right:24, zIndex:10 }}>
              <button type="button" className="pn-menu-btn" aria-label="Options">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /><circle cx="5" cy="12" r="1.2" />
                </svg>
              </button>
            </div>

            <div style={{ position:"relative", zIndex:1, maxWidth:440, width:"100%", margin:"0 auto" }}>

              {/* Title */}
              <h1 className="pn-auth-h1" style={{ fontSize:"2rem", fontWeight:700, letterSpacing:-0.6, lineHeight:1.15, marginBottom:4 }}>
                Admin Portal
              </h1>
              <h1 style={{ fontSize:"2.125rem", fontWeight:800, letterSpacing:-0.6, lineHeight:1.15, marginBottom:14 }}>
                <span style={{ background:"linear-gradient(90deg,#7B5CF6,#C4B5FD)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  Sign In
                </span>
              </h1>
              <p style={{ fontSize:"0.84375rem", color:"#64748B", fontWeight:400, lineHeight:1.6, marginBottom:34 }}>
                Staff sign-in to manage orders, quotes, payments, and customer messages.
              </p>

              {/* Success banner */}
              {successMsg && (
                <div style={{ marginBottom:20, background:"rgba(52,211,153,0.07)", border:"1px solid rgba(52,211,153,0.25)", color:"#A7F3D0", fontSize:"0.8125rem", borderRadius:10, padding:"12px 16px" }}>
                  {successMsg}
                </div>
              )}

              {/* URL-driven error banner (e.g. OAuth callback failures) */}
              {!error && urlErrorMsg && (
                <div style={{ marginBottom:20, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)", color:"#FCA5A5", fontSize:"0.8125rem", borderRadius:10, padding:"12px 16px" }}>
                  {urlErrorMsg}
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div style={{ marginBottom:20, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)", color:"#FCA5A5", fontSize:"0.8125rem", borderRadius:10, padding:"12px 16px" }}>
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailSignIn}>

                {/* Email */}
                <div style={{ marginBottom:18 }}>
                  <label style={{ display:"block", fontSize:"0.65625rem", fontWeight:600, color:"#475569", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                    Email Address
                  </label>
                  <input
                    type="email" id="login-email" required
                    placeholder="you@example.com" autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pn-input"
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:"0.65625rem", fontWeight:600, color:"#475569", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                    Password
                  </label>
                  <div style={{ position:"relative" }}>
                    <input
                      type={showPassword ? "text" : "password"} id="login-password" required
                      placeholder="••••••••" autoComplete="current-password"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pn-input" style={{ paddingRight:56 }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility" className="pn-eye-btn" disabled={loading}>
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot link */}
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4, marginBottom:28 }}>
                  <Link href="/forgot-password" style={{ fontSize:"0.78125rem", color:"#64748B", textDecoration:"none", transition:"color 0.2s" }} className="hover:text-[#9D82F8]">
                    Forgot password?
                  </Link>
                </div>

                {/* ── Sign In button ── */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`pn-btn-primary w-full mb-[14px] ${loadingType === "email" ? "pn-btn--loading" : ""}`}
                  aria-busy={loadingType === "email"}
                >
                  {loadingType === "email" ? (
                    <><Spinner color="white" /> Signing In…</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Sign In to Portal
                    </>
                  )}
                </button>

                {/* Step feedback — shown below email button while loading */}
                {loadingType === "email" && loadingStep && (
                  <div className="pn-step-pill" key={loadingStep}>
                    <div className="pn-step-dot" />
                    {loadingStep}
                  </div>
                )}
              </form>

              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                <div className="pn-auth-divider-line" />
                <span style={{ fontSize:"0.75rem", color:"#475569" }}>or</span>
                <div className="pn-auth-divider-line" />
              </div>

              {/* ── Google button ── */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`pn-btn-google mb-4 ${loadingType === "google" ? "pn-btn--loading" : ""}`}
                aria-busy={loadingType === "google"}
              >
                {loadingType === "google" ? (
                  <><Spinner color="purple" /> Connecting to Google…</>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {/* Google step feedback */}
              {loadingType === "google" && loadingStep && (
                <div className="pn-step-pill" key={loadingStep} style={{ marginBottom:16 }}>
                  <div className="pn-step-dot" />
                  {loadingStep}
                </div>
              )}

              {/* Footer */}
              <p style={{ textAlign:"center", fontSize:"0.8125rem", color:"#64748B", marginTop:8 }}>
                Access is restricted to Protonest staff. Need an account?{" "}
                <span style={{ color:"#94A3B8" }}>Contact your admin.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
