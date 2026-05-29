'use client'

import { useState } from 'react'
import { useLead, useUpdateLead } from '@/hooks/useLeads'
import { TierBadge } from './TierBadge'
import { ScoreBar } from './ScoreBar'
import { OutreachStatusSelect } from './OutreachStatusSelect'
import { formatPhone, formatDomain, relativeTime } from '@/lib/utils'
import { OUTREACH_STATUS_LABELS, OUTREACH_ACTIONS, OUTREACH_OUTCOMES } from '@/lib/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OutreachHistoryEntry, OutreachStatus } from '@/lib/types'
import { X, Phone, Globe, MapPin, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface LeadDetailDrawerProps {
  leadId: string | null
  onClose: () => void
}

function OutreachTimeline({ leadId }: { leadId: string }) {
  const { data: history } = useQuery<OutreachHistoryEntry[]>({
    queryKey: ['outreach-history', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/outreach`)
      return res.json()
    },
    enabled: !!leadId,
  })

  if (!history?.length) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
        No outreach logged yet.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {history.map(entry => (
        <div
          key={entry.id}
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {entry.action}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relativeTime(entry.created_at)}</span>
          </div>
          {entry.outcome && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
              Outcome: <span style={{ color: 'var(--text-primary)' }}>{entry.outcome}</span>
            </p>
          )}
          {entry.notes && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.notes}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function LogOutreachForm({ leadId }: { leadId: string }) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState('called')
  const [outcome, setOutcome] = useState('')
  const [notes, setNotes] = useState('')

  const logMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, outcome: outcome || null, notes: notes || null }),
      })
      if (!res.ok) throw new Error('Failed to log outreach')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-history', leadId] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setNotes('')
      setOutcome('')
      toast.success('Outreach logged')
    },
    onError: () => toast.error('Failed to log outreach'),
  })

  return (
    <div
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
        Log outreach
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select
          value={action}
          onChange={e => setAction(e.target.value)}
          style={selectStyle}
        >
          {OUTREACH_ACTIONS.map(a => (
            <option key={a.value} value={a.value} style={{ background: 'var(--panel)' }}>{a.label}</option>
          ))}
        </select>
        <select
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={{ background: 'var(--panel)' }}>Outcome (optional)</option>
          {OUTREACH_OUTCOMES.map(o => (
            <option key={o.value} value={o.value} style={{ background: 'var(--panel)' }}>{o.label}</option>
          ))}
        </select>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes…"
        rows={2}
        style={{
          width: '100%',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 13,
          color: 'var(--text-primary)',
          outline: 'none',
          resize: 'vertical',
          marginBottom: 8,
          fontFamily: 'inherit',
        }}
      />
      <button
        onClick={() => logMutation.mutate()}
        disabled={logMutation.isPending}
        style={primaryButtonStyle}
      >
        {logMutation.isPending ? 'Logging…' : 'Log action'}
      </button>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  cursor: 'pointer',
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--electric)',
  color: '#0A0A0B',
  border: 'none',
  borderRadius: 6,
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

export function LeadDetailDrawer({ leadId, onClose }: LeadDetailDrawerProps) {
  const { data: lead, isLoading } = useLead(leadId)
  const [showRaw, setShowRaw] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(true)

  if (!leadId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 480,
          background: 'var(--panel)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            position: 'sticky',
            top: 0,
            background: 'var(--panel)',
            zIndex: 1,
          }}
        >
          {isLoading ? (
            <div>
              <div className="skeleton" style={{ height: 22, width: 200, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: 140, borderRadius: 4 }} />
            </div>
          ) : lead ? (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <TierBadge tier={lead.tier} />
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {lead.name}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ScoreBar score={lead.score} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {lead.industry_label} · {lead.city.replace(', Ontario', '')}
              </p>
            </div>
          ) : null}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8, marginBottom: 12 }} />
            ))}
          </div>
        ) : lead ? (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  style={actionBtnStyle}
                >
                  <Phone size={14} />
                  {formatPhone(lead.phone)}
                </a>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" style={actionBtnStyle}>
                  <Globe size={14} />
                  {formatDomain(lead.website)}
                  <ExternalLink size={10} />
                </a>
              )}
              {lead.google_maps_url && (
                <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" style={actionBtnStyle}>
                  <MapPin size={14} />
                  Maps
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Pain notes */}
            {lead.notes && (
              <div
                style={{
                  background: 'rgba(255, 59, 48, 0.08)',
                  border: '1px solid rgba(255, 59, 48, 0.2)',
                  borderRadius: 8,
                  padding: '12px 14px',
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FF3B30', marginBottom: 8 }}>
                  Pain signals
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Score breakdown */}
            <div>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: 0,
                  marginBottom: showBreakdown ? 10 : 0,
                }}
              >
                {showBreakdown ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Score breakdown
              </button>
              {showBreakdown && lead.score_breakdown?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {lead.score_breakdown.map((signal, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'var(--background)',
                        borderRadius: 6,
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{signal.reason}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--electric)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        +{signal.points}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      padding: '6px 10px',
                      marginTop: 2,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      Total: {lead.score}/100
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Outreach status */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Outreach status
              </p>
              <OutreachStatusSelect leadId={lead.id} status={lead.outreach_status} />
            </div>

            {/* Log outreach */}
            <LogOutreachForm leadId={lead.id} />

            {/* History */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Outreach history
              </p>
              <OutreachTimeline leadId={lead.id} />
            </div>

            {/* Raw data toggle */}
            <div>
              <button
                onClick={() => setShowRaw(!showRaw)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: 0,
                }}
              >
                {showRaw ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Raw Google Places data
              </button>
              {showRaw && (
                <pre
                  style={{
                    marginTop: 8,
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    overflow: 'auto',
                    maxHeight: 300,
                  }}
                >
                  {JSON.stringify(lead.raw_data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 12,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'all 150ms ease-out',
}
