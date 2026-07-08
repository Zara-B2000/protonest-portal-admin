-- ═══════════════════════════════════════════════════════════════════════════
-- Protonest PCB Assembly Portal — Portal-wide System Settings
-- Migration: 005_portal_settings.sql
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push
-- ═══════════════════════════════════════════════════════════════════════════

-- ── portal_settings (singleton row) ──────────────────────────────────────
CREATE TABLE portal_settings (
  id                     INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_line_view      TEXT NOT NULL DEFAULT 'Line A',
  dashboard_auto_refresh  TEXT NOT NULL DEFAULT '30 sec',
  yield_alert_threshold  INTEGER NOT NULL DEFAULT 95,
  audit_logging          BOOLEAN NOT NULL DEFAULT TRUE,
  traceability           BOOLEAN NOT NULL DEFAULT TRUE,
  retention_period       TEXT NOT NULL DEFAULT '1 year',
  maintenance_mode       BOOLEAN NOT NULL DEFAULT FALSE,
  self_registration      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by             UUID REFERENCES profiles(id)
);

INSERT INTO portal_settings (id) VALUES (1);

CREATE TRIGGER trg_portal_settings_updated_at
  BEFORE UPDATE ON portal_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS — admin only (defense in depth; reads/writes happen via service role) ──
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_settings_admin_select" ON portal_settings
  FOR SELECT USING (is_admin());

CREATE POLICY "portal_settings_admin_update" ON portal_settings
  FOR UPDATE USING (is_admin());

-- ── Grants (service role reads/writes this table) ──────────────────────────
GRANT ALL PRIVILEGES ON portal_settings TO service_role;
