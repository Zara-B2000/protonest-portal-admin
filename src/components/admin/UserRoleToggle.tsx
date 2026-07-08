"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/(admin)/admin/users/actions";

interface UserRoleToggleProps {
  userId: string;
  currentRole: "admin" | "customer";
  isSelf: boolean;
}

export default function UserRoleToggle({ userId, currentRole, isSelf }: UserRoleToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return (
      <span style={{ fontSize: "0.71875rem", color: "var(--text3)", fontStyle: "italic" }}>
        You
      </span>
    );
  }

  const newRole = currentRole === "admin" ? "customer" : "admin";

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="tbl-actions" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`ta-btn ${currentRole === "admin" ? "ta-view" : "ta-quote"}`}
      >
        {isPending ? (
          <>
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none"
              style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Updating…
          </>
        ) : currentRole === "admin" ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Revoke Admin
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Make Admin
          </>
        )}
      </button>
      {error && (
        <span style={{ fontSize: "0.6875rem", color: "var(--danger)" }}>{error}</span>
      )}
    </div>
  );
}
