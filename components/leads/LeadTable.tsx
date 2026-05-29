'use client'

import { useState } from 'react'
import type { Lead } from '@/lib/types'
import { TierBadge } from './TierBadge'
import { ScoreBar } from './ScoreBar'
import { OutreachStatusSelect } from './OutreachStatusSelect'
import { formatPhone, formatDomain, relativeTime, exportLeadsToCSV } from '@/lib/utils'
import { SkeletonRow } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ExternalLink, ChevronUp, ChevronDown, MoreHorizontal, Trash2, Ban, Download } from 'lucide-react'
import { useDeleteLead, useUpdateStatus } from '@/hooks/useLeads'
import { toast } from 'sonner'

interface LeadTableProps {
  leads: Lead[]
  total: number
  page: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRowClick: (lead: Lead) => void
  sortBy: string
  sortDir: string
  onSort: (col: string) => void
}

const PER_PAGE = 50

const COLUMNS = [
  { key: '', label: '', width: 40 },
  { key: 'tier', label: 'Tier', width: 60, sortable: true },
  { key: 'score', label: 'Score', width: 120, sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'industry_label', label: 'Industry', width: 140 },
  { key: 'city', label: 'City', width: 140 },
  { key: 'phone', label: 'Phone', width: 140 },
  { key: 'website', label: 'Website', width: 120 },
  { key: 'outreach_status', label: 'Status', width: 160 },
  { key: 'last_contacted_at', label: 'Last contact', width: 110, sortable: true },
  { key: 'actions', label: '', width: 40 },
]

function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy: string; sortDir: string }) {
  if (col !== sortBy) return <ChevronUp size={12} style={{ opacity: 0.2 }} />
  return sortDir === 'desc' ? <ChevronDown size={12} style={{ color: 'var(--electric)' }} /> : <ChevronUp size={12} style={{ color: 'var(--electric)' }} />
}

export function LeadTable({
  leads, total, page, isLoading,
  onPageChange, onRowClick, sortBy, sortDir, onSort,
}: LeadTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const deleteLead = useDeleteLead()
  const updateStatus = useUpdateStatus()

  const totalPages = Math.ceil(total / PER_PAGE)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === leads.length) setSelected(new Set())
    else setSelected(new Set(leads.map(l => l.id)))
  }

  async function handleBulkMarkContacted() {
    for (const id of selected) {
      await updateStatus.mutateAsync({ id, status: 'CONTACTED' })
    }
    toast.success(`${selected.size} leads marked Contacted`)
    setSelected(new Set())
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} leads? This cannot be undone.`)) return
    for (const id of selected) {
      await deleteLead.mutateAsync(id)
    }
    toast.success(`${selected.size} leads deleted`)
    setSelected(new Set())
  }

  function handleExport() {
    const toExport = selected.size > 0 ? leads.filter(l => selected.has(l.id)) : leads
    exportLeadsToCSV(toExport)
    toast.success(`Exported ${toExport.length} leads to CSV`)
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--panel)',
            border: '1px solid var(--border-hover)',
            borderRadius: 10,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 30,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {selected.size} selected
          </span>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <button onClick={handleExport} style={bulkBtnStyle}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={handleBulkMarkContacted} style={bulkBtnStyle}>
            Mark Contacted
          </button>
          <button onClick={handleBulkDelete} style={{ ...bulkBtnStyle, color: 'var(--danger)' }}>
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} style={{ ...bulkBtnStyle, color: 'var(--text-muted)' }}>
            Cancel
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle({ width: 40 })}>
                <input
                  type="checkbox"
                  checked={selected.size === leads.length && leads.length > 0}
                  onChange={toggleAll}
                  style={{ accentColor: 'var(--electric)', cursor: 'pointer' }}
                />
              </th>
              {COLUMNS.filter(c => c.key !== '').map(col => (
                <th
                  key={col.key}
                  style={thStyle({ width: col.width })}
                  onClick={() => col.sortable ? onSort(col.key) : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: col.sortable ? 'pointer' : 'default' }}>
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} sortBy={sortBy} sortDir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={11} />)
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState
                    title="No leads found"
                    description="Try adjusting your filters or run a new scrape."
                    action={{ label: 'New scrape', href: '/scrape' }}
                  />
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  selected={selected.has(lead.id)}
                  onSelect={() => toggleSelect(lead.id)}
                  onClick={() => onRowClick(lead)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && total > PER_PAGE && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {total.toLocaleString()} leads · Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={paginationBtnStyle(page <= 1)}
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={paginationBtnStyle(page >= totalPages)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LeadRow({
  lead, selected, onSelect, onClick,
}: {
  lead: Lead
  selected: boolean
  onSelect: () => void
  onClick: () => void
}) {
  const deleteLead = useDeleteLead()
  const updateStatus = useUpdateStatus()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: selected ? 'rgba(0, 217, 255, 0.04)' : 'transparent',
        transition: 'background 100ms ease-out',
      }}
      className="hover:bg-[var(--panel-hover)]"
    >
      <td style={tdStyle} onClick={e => { e.stopPropagation(); onSelect() }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          onClick={e => e.stopPropagation()}
          style={{ accentColor: 'var(--electric)', cursor: 'pointer' }}
        />
      </td>
      <td style={tdStyle}><TierBadge tier={lead.tier} size="sm" /></td>
      <td style={tdStyle}><ScoreBar score={lead.score} /></td>
      <td style={tdStyle}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{lead.name}</span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.industry_label}</span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.city.replace(', Ontario', '')}</span>
      </td>
      <td style={tdStyle}>
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', textDecoration: 'none' }}
          >
            {formatPhone(lead.phone)}
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
        )}
      </td>
      <td style={tdStyle}>
        {lead.website ? (
          <a
            href={lead.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, color: 'var(--electric)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            {formatDomain(lead.website)}
            <ExternalLink size={10} />
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
        )}
      </td>
      <td style={tdStyle} onClick={e => e.stopPropagation()}>
        <OutreachStatusSelect leadId={lead.id} status={lead.outreach_status} compact />
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {relativeTime(lead.last_contacted_at)}
        </span>
      </td>
      <td style={tdStyle} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '4px',
                  zIndex: 10,
                  minWidth: 160,
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    updateStatus.mutate({ id: lead.id, status: 'DO_NOT_CONTACT' })
                  }}
                  style={menuItemStyle}
                >
                  <Ban size={13} /> Do not contact
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    if (confirm('Delete this lead?')) deleteLead.mutate(lead.id)
                  }}
                  style={{ ...menuItemStyle, color: 'var(--danger)' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function thStyle(opts: { width?: number } = {}): React.CSSProperties {
  return {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    ...(opts.width ? { width: opts.width, minWidth: opts.width } : {}),
  }
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
}

const bulkBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontSize: 13,
  padding: '4px 8px',
  borderRadius: 6,
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '7px 10px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontSize: 13,
  borderRadius: 6,
  textAlign: 'left',
}

function paginationBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: 12,
    color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  }
}
