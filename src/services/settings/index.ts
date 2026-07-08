import { createServiceClient } from "@/services/supabase/server";

export type PortalSettings = {
  defaultLineView: string;
  dashboardAutoRefresh: string;
  yieldAlertThreshold: number;
  auditLogging: boolean;
  traceability: boolean;
  retentionPeriod: string;
  maintenanceMode: boolean;
  selfRegistration: boolean;
};

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  defaultLineView: "Line A",
  dashboardAutoRefresh: "30 sec",
  yieldAlertThreshold: 95,
  auditLogging: true,
  traceability: true,
  retentionPeriod: "1 year",
  maintenanceMode: false,
  selfRegistration: true,
};

export async function getPortalSettings(): Promise<PortalSettings> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("portal_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return DEFAULT_PORTAL_SETTINGS;

  return {
    defaultLineView: data.default_line_view ?? DEFAULT_PORTAL_SETTINGS.defaultLineView,
    dashboardAutoRefresh: data.dashboard_auto_refresh ?? DEFAULT_PORTAL_SETTINGS.dashboardAutoRefresh,
    yieldAlertThreshold: data.yield_alert_threshold ?? DEFAULT_PORTAL_SETTINGS.yieldAlertThreshold,
    auditLogging: data.audit_logging ?? DEFAULT_PORTAL_SETTINGS.auditLogging,
    traceability: data.traceability ?? DEFAULT_PORTAL_SETTINGS.traceability,
    retentionPeriod: data.retention_period ?? DEFAULT_PORTAL_SETTINGS.retentionPeriod,
    maintenanceMode: data.maintenance_mode ?? DEFAULT_PORTAL_SETTINGS.maintenanceMode,
    selfRegistration: data.self_registration ?? DEFAULT_PORTAL_SETTINGS.selfRegistration,
  };
}
