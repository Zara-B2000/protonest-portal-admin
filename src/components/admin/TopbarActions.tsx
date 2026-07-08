"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield } from "lucide-react";
import NotificationsBell from "./NotificationsBell";
import QuickThemeToggle from "@/components/shared/QuickThemeToggle";

export default function TopbarActions() {
  const pathname = usePathname();
  const onSettingsPage = pathname?.startsWith("/admin/settings") ?? false;

  return (
    <div className="tb-actions">
      <div className="tb-admin-chip">
        <Shield className="w-3.5 h-3.5" />
        Admin Access
      </div>
      <div className="live-dot" title="Live data"></div>

      <QuickThemeToggle className="btn-icon" />

      {!onSettingsPage && (
        <>
          <NotificationsBell />
          <Link href="/admin/settings" className="btn-icon" title="Settings">
            <Settings />
          </Link>
        </>
      )}
    </div>
  );
}
