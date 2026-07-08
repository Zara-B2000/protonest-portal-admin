export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminProfile } from "@/services/auth";
import { createServiceClient } from "@/services/supabase/server";
import UserRoleToggle from "@/components/admin/UserRoleToggle";

function initials(fullName: string | null, email: string): string {
  if (fullName) {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "?";
}

function avatarClass(index: number): string {
  return ["av-1", "av-2", "av-3", "av-4"][index % 4];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export default async function UsersPage() {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) redirect("/login");
  if (!isAdminProfile(currentProfile)) redirect("/login");

  const supabase = createServiceClient();

  const [{ data: profiles }, { data: orderRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("role", { ascending: true })   // 'admin' < 'customer' alphabetically
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("customer_id"),
  ]);

  const orderCountMap: Record<string, number> = {};
  for (const row of orderRows ?? []) {
    if (row.customer_id) {
      orderCountMap[row.customer_id] = (orderCountMap[row.customer_id] ?? 0) + 1;
    }
  }

  const allUsers = profiles ?? [];
  const adminCount = allUsers.filter((p: UserRow) => p.role === "admin").length;
  const customerCount = allUsers.filter((p: UserRow) => p.role === "customer").length;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const newThisMonth = allUsers.filter(
    (p: UserRow) => new Date(p.created_at) >= monthStart
  ).length;

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="ph-eyebrow">User Management</div>
          <div className="ph-title">Portal <em>Users</em></div>
          <div className="ph-sub">
            Promote customers to admin or revoke access — changes take effect on next login.
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 28 }}>
        <div className="sc">
          <div className="sc-top">
            <div className="sc-icon si-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <div className="sc-val">{allUsers.length}</div>
          <div className="sc-lbl">Total Users</div>
          <div className="sc-bar"><div className="sc-bar-fill" style={{ width: "100%", background: "var(--p4)" }} /></div>
        </div>

        <div className="sc">
          <div className="sc-top">
            <div className="sc-icon si-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>
          <div className="sc-val">{adminCount}</div>
          <div className="sc-lbl">Admins</div>
          <div className="sc-bar"><div className="sc-bar-fill" style={{ width: adminCount / Math.max(allUsers.length, 1) * 100 + "%", background: "var(--danger)" }} /></div>
        </div>

        <div className="sc">
          <div className="sc-top">
            <div className="sc-icon si-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <div className="sc-val">{customerCount}</div>
          <div className="sc-lbl">Customers</div>
          <div className="sc-bar"><div className="sc-bar-fill" style={{ width: customerCount / Math.max(allUsers.length, 1) * 100 + "%", background: "var(--info)" }} /></div>
        </div>

        <div className="sc">
          <div className="sc-top">
            <div className="sc-icon si-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          <div className="sc-val">{newThisMonth}</div>
          <div className="sc-lbl">Joined This Month</div>
          <div className="sc-bar"><div className="sc-bar-fill" style={{ width: newThisMonth / Math.max(allUsers.length, 1) * 100 + "%", background: "var(--success)" }} /></div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="card">
        <div className="card-head">
          <div className="ch-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div className="ch-ttl">All Users</div>
            <div className="ch-sub">Admins are listed first</div>
          </div>
          <div className="ch-right">
            <span className="count-badge cb-purple">{allUsers.length} total</span>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user: UserRow, idx: number) => {
                const isSelf = user.id === currentProfile.id;
                const orders = orderCountMap[user.id] ?? 0;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="cust-cell">
                        <div
                          className={`cust-av ${avatarClass(idx)}`}
                          style={isSelf ? { outline: "2px solid var(--p4)", outlineOffset: 2 } : undefined}
                        >
                          {initials(user.full_name, user.email)}
                        </div>
                        <div>
                          <div className="cust-name">
                            {user.full_name || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>No name</span>}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text3)", marginTop: 1 }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.role === "admin" ? (
                        <span className="pill p-assembly">
                          <span className="pill-dot" />
                          Admin
                        </span>
                      ) : (
                        <span className="pill" style={{
                          background: "rgba(74,86,122,0.12)",
                          color: "var(--text2)",
                          border: "1px solid rgba(74,86,122,0.2)",
                        }}>
                          <span className="pill-dot" style={{ background: "var(--text3)" }} />
                          Customer
                        </span>
                      )}
                    </td>
                    <td style={{ color: "var(--text2)", fontSize: "0.8125rem" }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td>
                      {orders > 0 ? (
                        <span style={{ fontWeight: 600, color: "var(--text1)" }}>{orders}</span>
                      ) : (
                        <span className="quote-dash">—</span>
                      )}
                    </td>
                    <td>
                      <UserRoleToggle
                        userId={user.id}
                        currentRole={user.role as "admin" | "customer"}
                        isSelf={isSelf}
                      />
                    </td>
                  </tr>
                );
              })}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text3)", padding: "32px 18px" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
