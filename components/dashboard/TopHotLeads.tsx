'use client'

import { useState } from 'react'
import { useTopLeads } from '@/hooks/useLeads'
import { TierBadge } from '@/components/leads/TierBadge'
import { ScoreBar } from '@/components/leads/ScoreBar'
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer'
import { formatPhone } from '@/lib/utils'
import { OutreachStatusSelect } from '@/components/leads/OutreachStatusSelect'
import { SkeletonRow } from '@/components/shared/LoadingSpinner'
import type { Lead } from '@/lib/types'

export function TopHotLeads() {
  const { data: leads, isLoading } = useTopLeads()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Tier', 'Score', 'Name', 'City', 'Phone', 'Status'].map(col => (
                <th
                  key={col}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : (leads ?? []).map(lead => (
              <tr
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 100ms ease-out',
                }}
                className="hover:bg-[var(--panel-hover)]"
              >
                <td style={{ padding: '10px 12px' }}><TierBadge tier={lead.tier} size="sm" /></td>
                <td style={{ padding: '10px 12px' }}><ScoreBar score={lead.score} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{lead.name}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.city.replace(', Ontario', '')}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {formatPhone(lead.phone)}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                  <OutreachStatusSelect leadId={lead.id} status={lead.outreach_status} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && (leads ?? []).length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hot leads yet. Run a scrape to find them.</p>
          </div>
        )}
      </div>

      <LeadDetailDrawer leadId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  )
}
