"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadPref, PREF_KEYS } from "@/utils/userPrefs";

const TIMEOUT_MS: Record<string, number> = {
  "30 min":  30 * 60 * 1000,
  "1 hour":  60 * 60 * 1000,
  "4 hours": 4 * 60 * 60 * 1000,
  "Never":   0,
};

export default function SessionTimeoutWatcher() {
  const router = useRouter();

  useEffect(() => {
    const pref = loadPref<string>(PREF_KEYS.sessionTimeout, "1 hour");
    const ms = TIMEOUT_MS[pref] ?? 0;
    if (!ms) return;

    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/login?reason=timeout");
      }, ms);
    };

    reset();

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));

    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [router]);

  return null;
}
