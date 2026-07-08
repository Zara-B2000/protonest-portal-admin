"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVALS: Record<string, number> = {
  "15 sec": 15000,
  "30 sec": 30000,
  "1 min": 60000,
};

export default function DashboardAutoRefresh({ interval }: { interval: string }) {
  const router = useRouter();

  useEffect(() => {
    const ms = INTERVALS[interval];
    if (!ms) return;
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [interval, router]);

  return null;
}
