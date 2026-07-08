"use client";

import { useState } from "react";
import { createClient } from "@/services/supabase/client";
import { useRouter } from "next/navigation";

export default function UnifiedSignOutButton({
  children,
  className,
  title,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    if (pending) return;
    setPending(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signout error:", err);
    }
    router.push("/login");
    router.refresh();
    // Don't clear pending — page will navigate away
  };

  return (
    <button onClick={handleSignOut} disabled={pending} className={className} title={title} style={style}>
      {pending ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Signing out…
        </span>
      ) : children}
    </button>
  );
}
