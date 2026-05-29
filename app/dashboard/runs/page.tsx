'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useScrapeRuns } from '@/hooks/useScrapeRun'
import { useScrapeRun } from '@/hooks/useScrapeRun'
import { formatCurrency, formatDuration, relativeTime } from '@/lib/utils'
import type { ScrapeRun } from '@/lib/types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/shared/EmptyState'

function StatusBadge({ status }: { status: ScrapeRun['status'] }) {
  const config = {
    PENDING: { color: '#71717A', label: 'Pending', dot: false },
    RUNNING: { color: '#00D9FF', label: 'Running', dot: true },
    COMPLETED: { color: '#30D158', label: 'Completed', dot: false },
    FAILED: { color: '#FF453A', label: 'Failed', dot: false },
  }[status]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color: config.color,
        background: `${config.color}15`,
        border: `1px solid ${config.color}30`,
        borderRadius: 6,
        padding: '3px 8px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {config.dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: config.color, animation: 'pulse 1s infinite',
          flexShrink: 0,
        }} />
      )}
      {config.label}
    </span>
  )
}

function RunProgressBar({ run }: { run: ScrapeRun }) {
  const { data: live } = useScrapeRun(run.status === 'RUNNING' || run.status === 'PENDING' ? run.id : null)
  const current = live ?? run
  const pct = current.total_queries > 0
    ? Math.round((current.completed_queries / current.total_queries) * 100)
    : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'var(--border)',
          borderRadius: 2,
          overflow: 'hidden',
          minWidth: 80,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: current.status === 'FAILED' ? 'var(--danger)' : 'var(--electric)',
            borderRadius: 2,
            transition: 'width 500ms ease-out',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        {current.completed_queries}/{current.total_queries}
      </span>
    </div>
  )
}

function RunRow({ run }: { run: ScrapeRun }) {
  const [expanded, setExpanded] = useState(false)
  const { data: live } = useScrapeRun(run.status === 'RUNNING' || run.status === 'PENDING' ? run.id : null)
  const current = live ?? run

  return (
    <>
      <tr
        style={{
          borderBottom: expanded ? 'none' : '1px solid var(--border)',
          cursor: 'pointer',
          transition: 'background 100ms ease-out',
        }}
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-[var(--panel-hover)]"
      >
        <td style={tdStyle}>
          {expanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </td>
        <td style={tdStyle}><StatusBadge status={current.status} /></td>
        <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {relativeTime(run.created_at)}
        </td>
        <td style={{ ...tdStyle, maxWidth: 200 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {run.industries.join(', ')}
          </span>
        </td>
        <td style={{ ...tdStyle, minWidth: 160 }}>
          <RunProgressBar run={current} />
        </td>
        <td style={{ ...tdStyle, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {current.leads_found.toLocaleString()}
        </td>
        <td style={{ ...tdStyle, fontSize: 12, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
          +{current.new_leads}
        </td>
        <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(current.actual_cost_usd)}
        </td>
        <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {formatDuration(run.started_at, run.completed_at)}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={9} style={{ padding: '12px 20px', background: 'var(--background)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div>
                <p style={labelStyle}>Industries</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {run.industries.map(ind => (
                    <span key={ind} style={chipStyle}>{ind}</span>
                  ))}
                </div>
              </div>
              <div>
                <p style={labelStyle}>Cities ({run.cities.length})</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {run.cities.slice(0, 10).map(city => (
                    <span key={city} style={chipStyle}>{city.replace(', Ontario', '')}</span>
                  ))}
                  {run.cities.length > 10 && (
                    <span style={chipStyle}>+{run.cities.length - 10} more</span>
                  )}
                </div>
              </div>
              <div>
                <p style={labelStyle}>Details</p>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span>Est. cost: {formatCurrency(run.estimated_cost_usd)}</span>
                  <span>Actual: {formatCurrency(current.actual_cost_usd)}</span>
                  {run.error_message && (
                    <span style={{ color: 'var(--danger)' }}>Error: {run.error_message}</span>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function RunsPage() {
  const { data: runs, isLoading } = useScrapeRuns()

  return (
    <>
      <PageHeader
        label="History"
        title="Scrape Runs"
        subtitle={`${(runs?.length ?? 0)} total runs`}
        actions={
          <Link
            href="/dashboard/scrape"
            style={{
              background: 'var(--electric)',
              color: '#0A0A0B',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            New scrape
          </Link>
        }
      />

      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />
            ))}
          </div>
        ) : !runs?.length ? (
          <EmptyState
            title="No scrape runs yet"
            description="Start a scrape to find leads in your target markets."
            action={{ label: 'New scrape', href: '/scrape' }}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}></th>
                  {['Status', 'Date', 'Industries', 'Progress', 'Leads found', 'New leads', 'Cost', 'Duration'].map(col => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map(run => (
                  <RunRow key={run.id} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 6,
}

const chipStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-secondary)',
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '2px 6px',
}
