'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency, relativeTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { ScrapeRun } from '@/lib/types'
import Link from 'next/link'

interface ProcessResponse {
  done: boolean
  processed?: number
  leads_found?: number
  new_leads?: number
  remaining?: number
  cost?: number
  error?: string
}

const POLL_INTERVAL_MS = 2000

export default function RunDetailPage() {
  const { id: runId } = useParams<{ id: string }>()
  const [run, setRun] = useState<ScrapeRun | null>(null)
  const [status, setStatus] = useState<'loading' | 'polling' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [tierCounts, setTierCounts] = useState({ A: 0, B: 0, C: 0 })
  const pollingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch the run record from Supabase directly (fast, avoids routing through the API)
  const fetchRun = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('scrape_runs')
      .select('*')
      .eq('id', runId)
      .single()
    if (data) setRun(data as ScrapeRun)
    return data as ScrapeRun | null
  }, [runId])

  // Fetch tier breakdown from leads table
  const fetchTierCounts = useCallback(async () => {
    const supabase = createClient()
    const [a, b, c] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tier', 'A'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tier', 'B'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tier', 'C'),
    ])
    setTierCounts({ A: a.count ?? 0, B: b.count ?? 0, C: c.count ?? 0 })
  }, [])

  // Drive the polling loop — POST to /api/scrape/process repeatedly until done
  const processNext = useCallback(async () => {
    if (!pollingRef.current) return

    try {
      const res = await fetch('/api/scrape/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId }),
      })

      const data: ProcessResponse = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Process request failed')
        return
      }

      // Refresh run record and tier counts after each processed item
      await fetchRun()
      await fetchTierCounts()

      if (data.done) {
        pollingRef.current = false
        setStatus('done')
        return
      }

      // Schedule next poll
      if (pollingRef.current) {
        timerRef.current = setTimeout(processNext, POLL_INTERVAL_MS)
      }
    } catch (err) {
      // Network error — retry after a longer wait
      console.error('Process poll error:', err)
      if (pollingRef.current) {
        timerRef.current = setTimeout(processNext, 5000)
      }
    }
  }, [runId, fetchRun, fetchTierCounts])

  useEffect(() => {
    let mounted = true

    async function init() {
      const currentRun = await fetchRun()
      await fetchTierCounts()

      if (!mounted) return

      if (!currentRun) {
        setStatus('error')
        setErrorMsg('Run not found')
        return
      }

      // If already completed/failed, just show the final state
      if (currentRun.status === 'COMPLETED' || currentRun.status === 'FAILED') {
        setStatus('done')
        return
      }

      // Start the polling loop
      pollingRef.current = true
      setStatus('polling')
      timerRef.current = setTimeout(processNext, 100) // start almost immediately
    }

    init()

    return () => {
      mounted = false
      pollingRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fetchRun, fetchTierCounts, processNext])

  const pct = run && run.total_queries > 0
    ? Math.round((run.completed_queries / run.total_queries) * 100)
    : 0

  const isRunning = status === 'polling'

  return (
    <>
      <PageHeader
        label="Scrape Run"
        title={isRunning ? 'Scraping…' : status === 'done' ? 'Scrape Complete' : 'Scrape Run'}
        subtitle={run ? `Run ${runId.slice(0, 8)}… · Started ${relativeTime(run.started_at)}` : ''}
      />

      <div style={{ maxWidth: 720 }}>
        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          {isRunning && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--electric)',
                display: 'inline-block',
                animation: 'pulse 1s infinite',
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: status === 'done'
                ? 'var(--success)'
                : status === 'error'
                ? 'var(--danger)'
                : 'var(--electric)',
            }}
          >
            {status === 'loading' && 'Loading…'}
            {status === 'polling' && 'Processing queries…'}
            {status === 'done' && run?.status === 'COMPLETED' && 'Complete — all queries processed'}
            {status === 'done' && run?.status === 'FAILED' && 'Failed'}
            {status === 'error' && `Error: ${errorMsg}`}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Query progress
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {(run?.completed_queries ?? 0).toLocaleString()} / {(run?.total_queries ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Progress bar track */}
          <div
            style={{
              height: 8,
              background: 'var(--border)',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: status === 'done' ? 'var(--success)' : 'var(--electric)',
                borderRadius: 4,
                transition: 'width 400ms ease-out',
              }}
            />
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Stat label="Leads found" value={(run?.leads_found ?? 0).toLocaleString()} />
            <Stat label="New leads" value={(run?.new_leads ?? 0).toLocaleString()} color="var(--success)" />
            <Stat label="API cost" value={formatCurrency(run?.actual_cost_usd ?? 0)} />
            <Stat label="Progress" value={`${pct}%`} color={pct === 100 ? 'var(--success)' : 'var(--electric)'} />
          </div>
        </div>

        {/* Tier breakdown */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          <Stat label="Tier A — Hot" value={tierCounts.A.toLocaleString()} color="var(--tier-a)" />
          <Stat label="Tier B — Warm" value={tierCounts.B.toLocaleString()} color="var(--tier-b)" />
          <Stat label="Tier C — Cold" value={tierCounts.C.toLocaleString()} color="var(--tier-c)" />
        </div>

        {/* Industries and cities */}
        {run && (
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <p style={labelStyle}>Scope</p>
            <div style={{ display: 'flex', gap: 32, marginTop: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Industries</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {run.industries.map(ind => (
                    <span key={ind} style={chipStyle}>{ind}</span>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Cities ({run.cities.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {run.cities.slice(0, 8).map(city => (
                    <span key={city} style={chipStyle}>{city.replace(', Ontario', '')}</span>
                  ))}
                  {run.cities.length > 8 && (
                    <span style={chipStyle}>+{run.cities.length - 8} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {status === 'done' && (
            <Link
              href="/dashboard/leads"
              style={{
                background: 'var(--electric)',
                color: '#0A0A0B',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View {(run?.new_leads ?? 0).toLocaleString()} new leads →
            </Link>
          )}
          <Link
            href="/dashboard/runs"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              border: '1px solid var(--border)',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            All runs
          </Link>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: color ?? 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        {value}
      </p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const chipStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-secondary)',
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '2px 6px',
}
