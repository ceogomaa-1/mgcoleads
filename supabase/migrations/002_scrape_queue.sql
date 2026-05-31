-- ─────────────────────────────────────────
-- mgcoleads — Scrape Queue Migration
-- Run this in the Supabase SQL editor AFTER 001_init.sql
-- ─────────────────────────────────────────

-- One row per (industry × city × query) — the unit of work for the chunked worker
CREATE TABLE IF NOT EXISTS scrape_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES scrape_runs(id) ON DELETE CASCADE,
  industry_key    TEXT NOT NULL,
  industry_label  TEXT NOT NULL,
  city            TEXT NOT NULL,
  query           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | PROCESSING | COMPLETED | FAILED
  attempts        INT NOT NULL DEFAULT 0,
  error_message   TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_queue_status ON scrape_queue(status, run_id);
CREATE INDEX IF NOT EXISTS idx_scrape_queue_run ON scrape_queue(run_id);

ALTER TABLE scrape_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed users full access on scrape_queue"
  ON scrape_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Clean up any runs stuck in RUNNING from the old fire-and-forget pattern
UPDATE scrape_runs
SET status = 'FAILED',
    error_message = 'Stuck in RUNNING — abandoned by old worker pattern',
    completed_at = NOW()
WHERE status = 'RUNNING';
