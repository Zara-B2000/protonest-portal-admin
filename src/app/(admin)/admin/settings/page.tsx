export const dynamic = "force-dynamic";

import { getCurrentProfile, isAdminProfile } from "@/services/auth";
import { getPortalSettings } from "@/services/settings";
import { redirect } from "next/navigation";
import SettingsPage from "@/components/admin/SettingsPage";
import "./settings.css";

export const metadata = {
  title: "Protonest — Settings",
  description: "Configure your personal options and global portal configurations.",
};

export default async function AdminSettingsPage() {
  const profile = await getCurrentProfile();
  
  if (!profile) {
    redirect("/login");
  }
  
  if (!isAdminProfile(profile)) {
    redirect("/login");
  }

  // Pass profile fields to the page
  const initialProfile = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone || null,
    company: profile.company || null,
    role: profile.role,
  };

  const initialSystemSettings = await getPortalSettings();

  return <SettingsPage initialProfile={initialProfile} initialSystemSettings={initialSystemSettings} />;
}
