-- ─────────────────────────────────────────
-- mgcoleads — Initial Schema Migration
-- Run this in the Supabase SQL editor
-- ─────────────────────────────────────────

-- ENUMS
CREATE TYPE lead_tier AS ENUM ('A', 'B', 'C');
CREATE TYPE outreach_status AS ENUM (
  'NEW', 'CONTACTED', 'REPLIED', 'INTERESTED',
  'MEETING_BOOKED', 'CLOSED_WON', 'CLOSED_LOST', 'DO_NOT_CONTACT'
);
CREATE TYPE scrape_run_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- ─────────────────────────────────────────
-- LEADS — the core table
-- ─────────────────────────────────────────
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id            TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  industry_key        TEXT NOT NULL,
  industry_label      TEXT NOT NULL,
  city                TEXT NOT NULL,
  formatted_address   TEXT,
  phone               TEXT,
  website             TEXT,
  google_maps_url     TEXT,
  rating              NUMERIC(2,1),
  review_count        INTEGER DEFAULT 0,
  score               INTEGER NOT NULL DEFAULT 0,
  tier                lead_tier NOT NULL DEFAULT 'C',
  score_breakdown     JSONB DEFAULT '[]'::jsonb,
  notes               TEXT,
  raw_data            JSONB,
  outreach_status     outreach_status NOT NULL DEFAULT 'NEW',
  outreach_notes      TEXT,
  last_contacted_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_tier ON leads(tier);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_industry ON leads(industry_key);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_outreach_status ON leads(outreach_status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ─────────────────────────────────────────
-- SCRAPE_RUNS
-- ─────────────────────────────────────────
CREATE TABLE scrape_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status              scrape_run_status NOT NULL DEFAULT 'PENDING',
  industries          TEXT[] NOT NULL,
  cities              TEXT[] NOT NULL,
  total_queries       INTEGER DEFAULT 0,
  completed_queries   INTEGER DEFAULT 0,
  leads_found         INTEGER DEFAULT 0,
  new_leads           INTEGER DEFAULT 0,
  estimated_cost_usd  NUMERIC(8,2) DEFAULT 0,
  actual_cost_usd     NUMERIC(8,2) DEFAULT 0,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX idx_scrape_runs_created_at ON scrape_runs(created_at DESC);

-- ─────────────────────────────────────────
-- OUTREACH_HISTORY
-- ─────────────────────────────────────────
CREATE TABLE outreach_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  outcome         TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_history_lead_id ON outreach_history(lead_id);

-- ─────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────
CREATE TABLE settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed defaults — REPLACE the email with Mohamed's actual email
INSERT INTO settings (key, value) VALUES
  ('scoring_weights', '{
    "no_website": 20, "weak_website": 10, "low_rating": 10,
    "very_low_rating": 15, "few_reviews": 10, "no_booking_link": 12,
    "phone_listed": 8, "extended_hours": 10, "few_photos": 10,
    "recently_active": 5, "missed_call_reviews": 15
  }'::jsonb),
  ('tier_thresholds', '{"A": 70, "B": 45}'::jsonb),
  ('allowed_emails', '["mohamed.gomaa.business1@gmail.com"]'::jsonb);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed users can do everything on leads"
  ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authed users can do everything on scrape_runs"
  ON scrape_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authed users can do everything on outreach_history"
  ON outreach_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authed users can do everything on settings"
  ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
