"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Eye,
  Bell,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  HelpCircle,
  Camera,
  Save,
  RotateCcw,
  AlertTriangle,
  Smartphone,
  Laptop,
  Check,
  Trash2,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";
import UnifiedSignOutButton from "@/components/shared/SignOutButton";
import { updateAdminProfile, clearCache, deleteAllOrders, factoryReset, saveSystemSettings } from "@/app/(admin)/admin/settings/actions";
import { createClient } from "@/services/supabase/client";
import type { PortalSettings } from "@/services/settings";
import {
  PREF_KEYS,
  savePref,
  loadPref,
  clearAllPrefs,
  applyTheme,
  applySidebarStyle,
  applyDensity,
  applyFontSize,
  applyStatusStrip,
  applyAnimations,
} from "@/utils/userPrefs";

const DEFAULT_NOTIFS = {
  inApp: true,
  email: true,
  sms: false,
  sound: false,
};

interface SettingsPageProps {
  initialProfile: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    company: string | null;
    role: string;
  };
  initialSystemSettings: PortalSettings;
}

export default function SettingsPage({ initialProfile, initialSystemSettings }: SettingsPageProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Active section state
  const [activeSection, setActiveSection] = useState<"s-profile" | "s-appear" | "s-notif" | "s-sec" | "s-sys">("s-profile");

  // Profile Form States
  const [fullName, setFullName] = useState(initialProfile?.full_name || "");
  const [email] = useState(initialProfile?.email || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [company, setCompany] = useState(initialProfile?.company || "");
  const [jobTitle, setJobTitle] = useState("Assembly Line Manager");
  const [department, setDepartment] = useState("Manufacturing");
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Asia/Colombo (IST +5:30)");

  // Appearance States
  const [theme, setTheme] = useState<"light" | "dark" | "sys">("dark");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [sidebarStyle, setSidebarStyle] = useState("Full (icons + labels)");
  const [density, setDensity] = useState("Default");
  const [showStatusStrip, setShowStatusStrip] = useState(true);
  const [animateTransitions, setAnimateTransitions] = useState(true);
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);

  // Notification States
  const [channelInApp, setChannelInApp] = useState(DEFAULT_NOTIFS.inApp);
  const [channelEmail, setChannelEmail] = useState(DEFAULT_NOTIFS.email);
  const [channelSms, setChannelSms] = useState(DEFAULT_NOTIFS.sms);
  const [soundAlerts, setSoundAlerts] = useState(DEFAULT_NOTIFS.sound);

  // Security States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwPending, setPwPending] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("1 hour");
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [sessions, setSessions] = useState<
    {
      id: string;
      device: string;
      location: string;
      isCurrent: boolean;
      isDesktop: boolean;
    }[]
  >([]);

  // System States
  const [defaultLineView, setDefaultLineView] = useState(initialSystemSettings.defaultLineView);
  const [autoRefresh, setAutoRefresh] = useState(initialSystemSettings.dashboardAutoRefresh);
  const [yieldAlertThreshold, setYieldAlertThreshold] = useState(String(initialSystemSettings.yieldAlertThreshold));
  const [auditLogging, setAuditLogging] = useState(initialSystemSettings.auditLogging);
  const [traceability, setTraceability] = useState(initialSystemSettings.traceability);
  const [retentionPeriod, setRetentionPeriod] = useState(initialSystemSettings.retentionPeriod);
  const [maintenanceMode, setMaintenanceMode] = useState(initialSystemSettings.maintenanceMode);
  const [selfRegistration, setSelfRegistration] = useState(initialSystemSettings.selfRegistration);

  // Toast / Alert UI Banner State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Helper to trigger custom Toast notifications
  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = loadPref<"light" | "dark" | "sys">(PREF_KEYS.theme, "dark");
    const savedFontSize = loadPref<"small" | "medium" | "large">(PREF_KEYS.fontSize, "medium");
    const savedSidebarStyle = loadPref<string>(PREF_KEYS.sidebarStyle, "Full (icons + labels)");
    const savedDensity = loadPref<string>(PREF_KEYS.density, "Default");
    const savedStatusStrip = loadPref<boolean>(PREF_KEYS.statusStrip, true);
    const savedAnimations = loadPref<boolean>(PREF_KEYS.animations, true);
    const savedNotifs = loadPref<typeof DEFAULT_NOTIFS>(PREF_KEYS.notifs, DEFAULT_NOTIFS);
    const savedSessionTimeout = loadPref<string>(PREF_KEYS.sessionTimeout, "1 hour");
    setSessionTimeout(savedSessionTimeout);

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setSidebarStyle(savedSidebarStyle);
    setDensity(savedDensity);
    setShowStatusStrip(savedStatusStrip);
    setAnimateTransitions(savedAnimations);

    // Notifications
    setChannelInApp(savedNotifs.inApp);
    setChannelEmail(savedNotifs.email);
    setChannelSms(savedNotifs.sms);
    setSoundAlerts(savedNotifs.sound);

    // Apply layout prefs
    applyTheme(savedTheme);
    applyFontSize(savedFontSize);
    applySidebarStyle(savedSidebarStyle);
    applyDensity(savedDensity);
    applyStatusStrip(savedStatusStrip);
    applyAnimations(savedAnimations);

    setAppearanceLoaded(true);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!appearanceLoaded) return;
    applyTheme(theme);

    if (theme === "sys") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("sys");
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme, appearanceLoaded]);

  // Apply font size when changed
  useEffect(() => {
    if (!appearanceLoaded) return;
    applyFontSize(fontSize);
  }, [fontSize, appearanceLoaded]);

  // Apply sidebar style when changed
  useEffect(() => {
    if (!appearanceLoaded) return;
    applySidebarStyle(sidebarStyle);
  }, [sidebarStyle, appearanceLoaded]);

  // Apply dashboard density when changed
  useEffect(() => {
    if (!appearanceLoaded) return;
    applyDensity(density);
  }, [density, appearanceLoaded]);

  // Apply status strip visibility when changed
  useEffect(() => {
    if (!appearanceLoaded) return;
    applyStatusStrip(showStatusStrip);
  }, [showStatusStrip, appearanceLoaded]);

  // Apply animation preference when changed
  useEffect(() => {
    if (!appearanceLoaded) return;
    applyAnimations(animateTransitions);
  }, [animateTransitions, appearanceLoaded]);

  // Load real active session details from Supabase
  useEffect(() => {
    const loadSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const ua = navigator.userAgent;
        const isDesktop = !/Mobi|Android|iPhone|iPad/i.test(ua);
        const browser = ua.includes("Chrome")
          ? "Chrome"
          : ua.includes("Firefox")
          ? "Firefox"
          : ua.includes("Safari")
          ? "Safari"
          : ua.includes("Edge")
          ? "Edge"
          : "Browser";
        const os = ua.includes("Mac")
          ? "macOS"
          : ua.includes("Win")
          ? "Windows"
          : ua.includes("Linux")
          ? "Linux"
          : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : ua.includes("Android")
          ? "Android"
          : "Unknown OS";

        const createdAt = new Date(session.expires_at
          ? (session.expires_at - 3600) * 1000
          : Date.now()
        ).toLocaleString();

        setSessions([
          {
            id: "current",
            device: `${browser} · ${os}`,
            location: `Active now · signed in at ${createdAt}`,
            isCurrent: true,
            isDesktop,
          },
        ]);
      }
    };
    loadSession();
  }, []);

  // Handle active session revocation (local UI only — Supabase client SDK cannot revoke individual sessions by ID)
  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    showToast("Session removed from view", "info");
  };

  // Sign out all other active sessions via Supabase
  const handleSignOutOthers = async () => {
    setSigningOutOthers(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) {
        showToast("Failed to sign out other sessions: " + error.message, "error");
      } else {
        showToast("Signed out from all other sessions", "success");
      }
    } catch {
      showToast("Failed to sign out other sessions", "error");
    } finally {
      setSigningOutOthers(false);
    }
  };

  // Profile Save Form Action
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("full_name", fullName);
    fd.append("phone", phone);
    fd.append("company", company);

    startTransition(async () => {
      const res = await updateAdminProfile(fd);
      if ("error" in res) {
        showToast(res.error, "error");
      } else {
        showToast("Profile settings saved successfully", "success");
        router.refresh();
      }
    });
  };

  const handleDiscardProfileChanges = () => {
    setFullName(initialProfile?.full_name || "");
    setPhone(initialProfile?.phone || "");
    setCompany(initialProfile?.company || "");
    showToast("Changes discarded", "info");
  };

  const handleSaveAppearance = () => {
    savePref(PREF_KEYS.theme, theme);
    savePref(PREF_KEYS.fontSize, fontSize);
    savePref(PREF_KEYS.sidebarStyle, sidebarStyle);
    savePref(PREF_KEYS.density, density);
    savePref(PREF_KEYS.statusStrip, showStatusStrip);
    savePref(PREF_KEYS.animations, animateTransitions);
    showToast("Appearance settings updated", "success");
  };

  const handleResetAppearance = () => {
    clearAllPrefs();
    setTheme("dark");
    setFontSize("medium");
    setSidebarStyle("Full (icons + labels)");
    setDensity("Default");
    setShowStatusStrip(true);
    setAnimateTransitions(true);
    applyTheme("dark");
    applyFontSize("medium");
    applySidebarStyle("Full (icons + labels)");
    applyDensity("Default");
    applyStatusStrip(true);
    applyAnimations(true);
    showToast("Appearance reset to defaults", "info");
  };

  const handleSaveNotifications = () => {
    const prefs = {
      inApp: channelInApp,
      email: channelEmail,
      sms: channelSms,
      sound: soundAlerts,
    };
    savePref(PREF_KEYS.notifs, prefs);
    showToast("Notification preferences updated", "success");
  };

  // Secure Password Update via Supabase auth API
  const handleUpdatePassword = async () => {
    if (!newPassword) {
      showToast("Please enter a new password", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setPwPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwPending(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Password updated successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSaveSystem = () => {
    const fd = new FormData();
    fd.append("default_line_view", defaultLineView);
    fd.append("dashboard_auto_refresh", autoRefresh);
    fd.append("yield_alert_threshold", yieldAlertThreshold);
    fd.append("audit_logging", String(auditLogging));
    fd.append("traceability", String(traceability));
    fd.append("retention_period", retentionPeriod);
    fd.append("maintenance_mode", String(maintenanceMode));
    fd.append("self_registration", String(selfRegistration));

    startTransition(async () => {
      const res = await saveSystemSettings(fd);
      if ("error" in res) {
        showToast(res.error, "error");
      } else {
        showToast("System settings saved successfully", "success");
        router.refresh();
      }
    });
  };

  const handleDiscardSystemChanges = () => {
    setDefaultLineView(initialSystemSettings.defaultLineView);
    setAutoRefresh(initialSystemSettings.dashboardAutoRefresh);
    setYieldAlertThreshold(String(initialSystemSettings.yieldAlertThreshold));
    setAuditLogging(initialSystemSettings.auditLogging);
    setTraceability(initialSystemSettings.traceability);
    setRetentionPeriod(initialSystemSettings.retentionPeriod);
    setMaintenanceMode(initialSystemSettings.maintenanceMode);
    setSelfRegistration(initialSystemSettings.selfRegistration);
    showToast("Discarded system changes", "info");
  };

  const handleClearCache = () => {
    startTransition(async () => {
      const res = await clearCache();
      if ("error" in res) {
        showToast(res.error, "error");
      } else {
        showToast("System cache cleared", "info");
      }
    });
  };

  const handleDeleteAllOrders = () => {
    if (confirm("CRITICAL WARNING: This will permanently delete ALL order records, files, and transaction history. This action CANNOT be undone. Are you absolutely sure you want to proceed?")) {
      startTransition(async () => {
        const res = await deleteAllOrders();
        if ("error" in res) {
          showToast(res.error, "error");
        } else {
          showToast("All orders deleted", "info");
        }
      });
    }
  };

  const handleFactoryReset = () => {
    if (confirm("CRITICAL WARNING: This will reset the portal to its original installation state, deleting all configurations and accounts. This action is irreversible. Proceed?")) {
      startTransition(async () => {
        const res = await factoryReset();
        if ("error" in res) {
          showToast(res.error, "error");
        } else {
          showToast("Portal reset to factory defaults", "info");
          router.replace("/login");
        }
      });
    }
  };

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="settings-root">
      {/* Dynamic Toast Message */}
      {toastMessage && (
        <div 
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-xl px-5 py-3.5 shadow-2xl flex items-center gap-3 border transition-all duration-300 transform scale-100"
          style={{
            background: toastMessage.type === "success" ? "#065F46" : toastMessage.type === "error" ? "#991B1B" : "#1E3A8A",
            borderColor: toastMessage.type === "success" ? "rgba(52,211,153,0.3)" : toastMessage.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(96,165,250,0.3)",
            color: "#FFFFFF",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
          }}
        >
          {toastMessage.type === "success" && <Check className="w-5 h-5 text-emerald-300" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-5 h-5 text-red-300" />}
          {toastMessage.type === "info" && <HelpCircle className="w-5 h-5 text-blue-300" />}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      <div className="s-bg-deco"></div>
      <div className="s-grid-lines"></div>

      {/* ── SETTINGS NAVIGATION ── */}
      <nav className="s-snav" role="tablist" aria-label="Settings sections">
        <div className="s-snav-title">Settings</div>
        <button 
          type="button"
          role="tab"
          aria-selected={activeSection === "s-profile"}
          className={`si ${activeSection === "s-profile" ? "active" : ""}`}
          onClick={() => setActiveSection("s-profile")}
        >
          <User />
          Profile
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeSection === "s-appear"}
          className={`si ${activeSection === "s-appear" ? "active" : ""}`}
          onClick={() => setActiveSection("s-appear")}
        >
          <Eye />
          Appearance
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeSection === "s-notif"}
          className={`si ${activeSection === "s-notif" ? "active" : ""}`}
          onClick={() => setActiveSection("s-notif")}
        >
          <Bell />
          Notifications
          <span className="si-dot"></span>
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeSection === "s-sec"}
          className={`si ${activeSection === "s-sec" ? "active" : ""}`}
          onClick={() => setActiveSection("s-sec")}
        >
          <Shield />
          Security
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeSection === "s-sys"}
          className={`si ${activeSection === "s-sys" ? "active" : ""}`}
          onClick={() => setActiveSection("s-sys")}
        >
          <SettingsIcon />
          System
          <span className="s-bdg s-bdg-gray ml-2 text-[9px] px-1 py-0.5">Admin</span>
        </button>
      </nav>

      {/* ── SETTINGS SECTIONS CONTENT ── */}
      <div className="s-scontent" id="scroll-area">

        {/* ══ PROFILE SECTION ══ */}
        {activeSection === "s-profile" && (
          <div className="s-section" id="s-profile">
            <div className="sec-card">
              <div className="sec-head">
                <div className="sh-icon shi-purple">
                  <User />
                </div>
                <div>
                  <div className="sh-title">Profile Settings</div>
                  <div className="sh-sub">Manage your personal info and account details</div>
                </div>
              </div>

              {/* Profile banner */}
              <div className="profile-banner">
                <div className="pf-av">{initials}</div>
                <div className="pf-info">
                  <div className="pf-name">{fullName || email}</div>
                  <div className="pf-role">{jobTitle} · Protonest PCB Portal</div>
                  <div className="pf-tags">
                    <span className="s-bdg s-bdg-blue">✦ Admin</span>
                    <span className="s-bdg s-bdg-green">● Active</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="s-row">
                  <div className="rl"><div className="rl-label">Full name</div></div>
                  <div className="rc">
                    <input 
                      className="s-inp" 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      style={{ width: "200px" }} 
                    />
                  </div>
                </div>
                <div className="s-row">
                  <div className="rl">
                    <div className="rl-label">Email address</div>
                    <div className="rl-desc">Used for login — cannot be changed here</div>
                  </div>
                  <div className="rc">
                    <input 
                      className="s-inp" 
                      type="email" 
                      value={email} 
                      disabled
                      style={{ width: "220px", opacity: 0.5, cursor: "not-allowed" }} 
                    />
                  </div>
                </div>
                <div className="s-row">
                  <div className="rl"><div className="rl-label">Phone number</div></div>
                  <div className="rc">
                    <input 
                      className="s-inp" 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      style={{ width: "200px" }} 
                    />
                  </div>
                </div>
                <div className="s-row">
                  <div className="rl"><div className="rl-label">Company / Organisation</div></div>
                  <div className="rc">
                    <input 
                      className="s-inp" 
                      type="text" 
                      value={company} 
                      onChange={(e) => setCompany(e.target.value)} 
                      style={{ width: "220px" }} 
                    />
                  </div>
                </div>
                <div className="s-row">
                  <div className="rl"><div className="rl-label">Job title</div></div>
                  <div className="rc">
                    <input 
                      className="s-inp" 
                      type="text" 
                      value={jobTitle} 
                      onChange={(e) => setJobTitle(e.target.value)} 
                      style={{ width: "220px" }} 
                    />
                  </div>
                </div>
                <div className="s-row">
                  <div className="rl"><div className="rl-label">Department</div></div>
                  <div className="rc">
                    <select 
                      className="s-inp" 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                      style={{ width: "190px" }}
                    >
                      <option>Manufacturing</option>
                      <option>Quality Control</option>
                      <option>Engineering</option>
                      <option>IT / Admin</option>
                    </select>
                  </div>
                </div>
                <div className="s-row">
                  <div className="rl"><div className="rl-label">Language</div></div>
                  <div className="rc">
                    <select 
                      className="s-inp" 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)} 
                      style={{ width: "160px" }}
                    >
                      <option>English</option>
                      <option>Tamil</option>
                      <option>Sinhala</option>
                    </select>
                  </div>
                </div>
                <div className="s-row">
                  <div className="rl"><div className="rl-label">Timezone</div></div>
                  <div className="rc">
                    <select 
                      className="s-inp" 
                      value={timezone} 
                      onChange={(e) => setTimezone(e.target.value)} 
                      style={{ width: "220px" }}
                    >
                      <option>Asia/Colombo (IST +5:30)</option>
                      <option>UTC</option>
                      <option>Asia/Singapore (+8:00)</option>
                    </select>
                  </div>
                </div>
                <div className="s-btn-row">
                  <button type="button" className="s-btn s-btn-outline" onClick={handleDiscardProfileChanges}>Discard</button>
                  <button type="submit" className="s-btn s-btn-primary" disabled={pending}>
                    <Save className="w-3.5 h-3.5" />
                    {pending ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ APPEARANCE SECTION ══ */}
        {activeSection === "s-appear" && (
          <div className="s-section" id="s-appear">
            <div className="sec-card">
              <div className="sec-head">
                <div className="sh-icon shi-purple">
                  <Eye />
                </div>
                <div>
                  <div className="sh-title">Appearance</div>
                  <div className="sh-sub">Customize how the portal looks for you</div>
                </div>
              </div>

              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Theme</div>
                  <div className="rl-desc">Choose your preferred display theme</div>
                </div>
                <div className="rc">
                  <div className="theme-pick">
                    <button 
                      className={`topt ${theme === "light" ? "sel" : ""}`} 
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      Light
                    </button>
                    <button 
                      className={`topt ${theme === "dark" ? "sel" : ""}`} 
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      Dark
                    </button>
                    <button 
                      className={`topt ${theme === "sys" ? "sel" : ""}`} 
                      onClick={() => setTheme("sys")}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      System
                    </button>
                  </div>
                </div>
              </div>

              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Font size</div>
                  <div className="rl-desc">Adjust size of text across the portal</div>
                </div>
                <div className="rc">
                  <select 
                    className="s-inp" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(e.target.value as "small" | "medium" | "large")} 
                    style={{ width: "160px" }}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div className="s-row">
                <div className="rl"><div className="rl-label">Sidebar style</div></div>
                <div className="rc">
                  <select 
                    className="s-inp" 
                    value={sidebarStyle} 
                    onChange={(e) => setSidebarStyle(e.target.value)} 
                    style={{ width: "180px" }}
                  >
                    <option>Full (icons + labels)</option>
                    <option>Compact (icons only)</option>
                    <option>Hidden (toggle)</option>
                  </select>
                </div>
              </div>

              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Dashboard density</div>
                  <div className="rl-desc">Adjust card and row spacing</div>
                </div>
                <div className="rc">
                  <select 
                    className="s-inp" 
                    value={density} 
                    onChange={(e) => setDensity(e.target.value)} 
                    style={{ width: "160px" }}
                  >
                    <option>Comfortable</option>
                    <option>Default</option>
                    <option>Compact</option>
                  </select>
                </div>
              </div>

              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Show line status bar</div>
                  <div className="rl-desc">Pinned status strip at top of dashboard</div>
                </div>
                <div className="rc">
                  <button 
                    className={`s-tog ${showStatusStrip ? "on" : ""}`} 
                    onClick={() => setShowStatusStrip(!showStatusStrip)}
                  />
                </div>
              </div>

              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Animate transitions</div>
                  <div className="rl-desc">Page and panel motion effects</div>
                </div>
                <div className="rc">
                  <button 
                    className={`s-tog ${animateTransitions ? "on" : ""}`} 
                    onClick={() => setAnimateTransitions(!animateTransitions)}
                  />
                </div>
              </div>

              <div className="s-btn-row">
                <button className="s-btn s-btn-outline" onClick={handleResetAppearance}>Reset to defaults</button>
                <button className="s-btn s-btn-primary" onClick={handleSaveAppearance}>
                  <Save className="w-3.5 h-3.5" />
                  Save appearance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ NOTIFICATIONS SECTION ══ */}
        {activeSection === "s-notif" && (
          <div className="s-section" id="s-notif">
            <div className="sec-card">
              <div className="sec-head">
                <div className="sh-icon shi-amber">
                  <Bell />
                </div>
                <div>
                  <div className="sh-title">Notifications</div>
                  <div className="sh-sub">Control what alerts you receive and how</div>
                </div>
              </div>

              <div className="sub-hd">Delivery Channels</div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">In-app notifications</div>
                </div>
                <div className="rc">
                  <button className={`s-tog ${channelInApp ? "on" : ""}`} onClick={() => setChannelInApp(!channelInApp)} />
                </div>
              </div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Email alerts</div>
                </div>
                <div className="rc">
                  <button className={`s-tog ${channelEmail ? "on" : ""}`} onClick={() => setChannelEmail(!channelEmail)} />
                </div>
              </div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">SMS / WhatsApp alerts</div>
                  <div className="rl-desc">Critical faults only</div>
                </div>
                <div className="rc">
                  <button className={`s-tog ${channelSms ? "on" : ""}`} onClick={() => setChannelSms(!channelSms)} />
                </div>
              </div>

              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Sound alerts</div>
                  <div className="rl-desc">Audio ping for critical faults</div>
                </div>
                <div className="rc">
                  <button className={`s-tog ${soundAlerts ? "on" : ""}`} onClick={() => setSoundAlerts(!soundAlerts)} />
                </div>
              </div>
              <div className="s-btn-row">
                <button className="s-btn s-btn-primary" onClick={handleSaveNotifications}>
                  <Save className="w-3.5 h-3.5" />
                  Save notifications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ SECURITY SECTION ══ */}
        {activeSection === "s-sec" && (
          <div className="s-section" id="s-sec">
            <div className="sec-card">
              <div className="sec-head">
                <div className="sh-icon shi-danger">
                  <Shield />
                </div>
                <div>
                  <div className="sh-title">Security</div>
                  <div className="sh-sub">Password, 2FA, and active sessions</div>
                </div>
              </div>

              <div className="sub-hd">Change Password</div>
              <div className="s-row">
                <div className="rl"><div className="rl-label">New password</div></div>
                <div className="rc">
                  <input 
                    className="s-inp" 
                    type="password" 
                    placeholder="Min. 8 characters" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: "200px" }} 
                  />
                </div>
              </div>
              <div className="s-row">
                <div className="rl"><div className="rl-label">Confirm new password</div></div>
                <div className="rc">
                  <input 
                    className="s-inp" 
                    type="password" 
                    placeholder="Repeat new password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: "200px" }} 
                  />
                </div>
              </div>
              <div className="s-btn-row" style={{ borderTop: "none", paddingTop: 0 }}>
                <button 
                  className="s-btn s-btn-primary" 
                  style={{ background: "linear-gradient(135deg, var(--s-danger), #B91C1C)", boxShadow: "0 3px 12px rgba(248,113,113,.3)" }}
                  onClick={handleUpdatePassword}
                  disabled={pwPending}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {pwPending ? "Updating..." : "Update password"}
                </button>
              </div>

              <div className="sub-div"></div>
              <div className="sub-hd">Access & Sessions</div>
              <div className="s-row" style={{ opacity: 0.6, pointerEvents: "none", userSelect: "none" }}>
                <div className="rl">
                  <div className="rl-label">Two-factor authentication (2FA)</div>
                  <div className="rl-desc">Authenticator app — strongly recommended</div>
                </div>
                <div className="rc" style={{ gap: 8 }}>
                  <span className="s-bdg s-bdg-gray">Not set up</span>
                  <span className="s-bdg s-bdg-gray" style={{ fontSize: "0.625rem", letterSpacing: ".05em" }}>Coming soon</span>
                </div>
              </div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Session timeout</div>
                  <div className="rl-desc">Auto logout after inactivity — takes effect immediately</div>
                </div>
                <div className="rc">
                  <select
                    className="s-inp"
                    value={sessionTimeout}
                    onChange={(e) => {
                      setSessionTimeout(e.target.value);
                      savePref(PREF_KEYS.sessionTimeout, e.target.value);
                      showToast(`Session timeout set to ${e.target.value}`, "success");
                    }}
                    style={{ width: "150px" }}
                  >
                    <option>30 min</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>

              <div className="sub-div"></div>
              <div className="sub-hd">Active Sessions</div>
              
              {sessions.map(session => (
                <div className="sess" key={session.id}>
                  <div className="sess-ic">
                    {session.isDesktop ? <Laptop className="w-[18px] h-[18px]" /> : <Smartphone className="w-[18px] h-[18px]" />}
                  </div>
                  <div className="sess-info">
                    <div className="sess-dev">
                      {session.device} 
                      {session.isCurrent && <span className="s-bdg s-bdg-green text-[10px] ml-1.5">● Current</span>}
                    </div>
                    <div className="sess-meta">{session.location}</div>
                  </div>
                  {!session.isCurrent && (
                    <button 
                      className="s-btn s-btn-danger text-[12px] h-[30px] px-3 py-1" 
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}

              <div className="s-btn-row">
                <button
                  className="s-btn s-btn-danger"
                  onClick={handleSignOutOthers}
                  disabled={signingOutOthers}
                >
                  {signingOutOthers
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Signing out…</>
                    : <><LogOut className="w-3.5 h-3.5" /> Sign out all other sessions</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ SYSTEM SECTION ══ */}
        {activeSection === "s-sys" && (
          <div className="s-section" id="s-sys">
            <div className="sec-card">
              <div className="sec-head">
                <div className="sh-icon shi-slate">
                  <SettingsIcon />
                </div>
                <div>
                  <div className="sh-title">System Settings <span className="s-bdg s-bdg-gray ml-1.5 text-[10px]">Admin only</span></div>
                  <div className="sh-sub">Portal-wide configuration for all users</div>
                </div>
              </div>

              <div className="sub-hd">Assembly Defaults</div>
              <div className="s-row">
                <div className="rl"><div className="rl-label">Default assembly line view</div></div>
                <div className="rc">
                  <select 
                    className="s-inp" 
                    value={defaultLineView} 
                    onChange={(e) => setDefaultLineView(e.target.value)} 
                    style={{ width: "170px" }}
                  >
                    <option>Line A</option>
                    <option>Line B</option>
                    <option>Line C</option>
                    <option>All lines</option>
                  </select>
                </div>
              </div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Dashboard auto-refresh</div>
                  <div className="rl-desc">Live data polling interval</div>
                </div>
                <div className="rc">
                  <select 
                    className="s-inp" 
                    value={autoRefresh} 
                    onChange={(e) => setAutoRefresh(e.target.value)} 
                    style={{ width: "150px" }}
                  >
                    <option>Off</option>
                    <option>15 sec</option>
                    <option>30 sec</option>
                    <option>1 min</option>
                  </select>
                </div>
              </div>
              <div className="s-row">
                <div className="rl"><div className="rl-label">Default yield alert threshold</div></div>
                <div className="rc">
                  <input 
                    className="s-inp text-center" 
                    type="text" 
                    value={yieldAlertThreshold} 
                    onChange={(e) => setYieldAlertThreshold(e.target.value)}
                    style={{ width: "70px" }} 
                  />
                  <span className="text-[14px] text-[#4A567A] font-semibold ml-1.5">%</span>
                </div>
              </div>

              <div className="sub-div"></div>
              <div className="sub-hd">Compliance & Audit</div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Audit logging</div>
                  <div className="rl-desc">Record all admin actions with timestamp</div>
                </div>
                <div className="rc">
                  <button className={`s-tog ${auditLogging ? "on" : ""}`} onClick={() => setAuditLogging(!auditLogging)} />
                </div>
              </div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Board-level traceability</div>
                  <div className="rl-desc">Barcode / QR scan at every stage</div>
                </div>
                <div className="rc">
                  <button className={`s-tog ${traceability ? "on" : ""}`} onClick={() => setTraceability(!traceability)} />
                </div>
              </div>
              <div className="s-row">
                <div className="rl"><div className="rl-label">Data data retention period</div></div>
                <div className="rc">
                  <select 
                    className="s-inp" 
                    value={retentionPeriod} 
                    onChange={(e) => setRetentionPeriod(e.target.value)} 
                    style={{ width: "150px" }}
                  >
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>1 year</option>
                    <option>3 years</option>
                  </select>
                </div>
              </div>

              <div className="sub-div"></div>
              <div className="sub-hd">Maintenance</div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Maintenance mode</div>
                  <div className="rl-desc">Restrict portal access to admins only</div>
                </div>
                <div className="rc">
                  <button className={`s-tog ${maintenanceMode ? "on" : ""}`} onClick={() => setMaintenanceMode(!maintenanceMode)} />
                </div>
              </div>
              <div className="s-row">
                <div className="rl"><div className="rl-label">Allow user self-registration</div></div>
                <div className="rc">
                  <button className={`s-tog ${selfRegistration ? "on" : ""}`} onClick={() => setSelfRegistration(!selfRegistration)} />
                </div>
              </div>
              <div className="s-btn-row">
                <button className="s-btn s-btn-danger" onClick={handleClearCache}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Clear cache
                </button>
                <button className="s-btn s-btn-outline" onClick={handleDiscardSystemChanges}>Discard</button>
                <button className="s-btn s-btn-primary" onClick={handleSaveSystem}>
                  <Save className="w-3.5 h-3.5" />
                  Save system settings
                </button>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="danger-zone">
              <div className="dz-head">
                <AlertTriangle className="w-[15px] h-[15px]" />
                Danger Zone
              </div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Delete all order data</div>
                  <div className="rl-desc">Permanently removes all orders, files, and history. This cannot be undone.</div>
                </div>
                <div className="rc">
                  <button className="s-btn s-btn-danger" onClick={handleDeleteAllOrders}>Delete all data</button>
                </div>
              </div>
              <div className="s-row">
                <div className="rl">
                  <div className="rl-label">Reset portal to factory defaults</div>
                  <div className="rl-desc">Wipes all settings and user configurations.</div>
                </div>
                <div className="rc">
                  <button className="s-btn s-btn-danger" onClick={handleFactoryReset}>Factory reset</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* /scontent */}
    </div>
  );
}
