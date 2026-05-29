'use client'

import { useScrapeRuns } from '@/hooks/useScrapeRun'
import { formatCurrency, formatDuration, relativeTime } from '@/lib/utils'
import type { ScrapeRun } from '@/lib/types'
import Link from 'next/link'

function RunStatusBadge({ status }: { status: ScrapeRun['status'] }) {
  const config = {
    PENDING: { color: '#71717A', label: 'Pending' },
    RUNNING: { color: '#00D9FF', label: 'Running' },
    COMPLETED: { color: '#30D158', label: 'Done' },
    FAILED: { color: '#FF453A', label: 'Failed' },
  }[status]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: config.color,
        background: `${config.color}15`,
        border: `1px solid ${config.color}30`,
        borderRadius: 6,
        padding: '2px 7px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {status === 'RUNNING' && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: config.color,
          display: 'inline-block',
          animation: 'pulse 1s infinite',
        }} />
      )}
      {config.label}
    </span>
  )
}

export function RecentRunsTable() {
  const { data: runs, isLoading } = useScrapeRuns()
  const recent = runs?.slice(0, 5) ?? []

  return (
    <div>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 6 }} />
        ))
      ) : recent.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No scrape runs yet.</p>
          <Link
            href="/dashboard/scrape"
            style={{ color: 'var(--electric)', fontSize: 13, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}
          >
            Start your first scrape →
          </Link>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Status', 'Date', 'Leads', 'New', 'Cost'].map(col => (
                <th key={col} style={{
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map(run => (
              <tr key={run.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 10px' }}><RunStatusBadge status={run.status} /></td>
                <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {relativeTime(run.created_at)}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 13, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {run.leads_found.toLocaleString()}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                  +{run.new_leads}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(run.actual_cost_usd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {recent.length > 0 && (
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Link
            href="/dashboard/runs"
            style={{ fontSize: 12, color: 'var(--electric)', textDecoration: 'none' }}
          >
            View all runs →
          </Link>
        </div>
      )}
    </div>
  )
}
