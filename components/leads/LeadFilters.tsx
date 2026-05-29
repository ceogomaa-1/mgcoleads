'use client'

import { INDUSTRIES } from '@/lib/scraper/industries'
import { CITY_GROUPS, cityDisplayName } from '@/lib/cities'
import { OUTREACH_STATUS_LABELS, type LeadTier, type OutreachStatus } from '@/lib/types'

interface LeadFiltersState {
  tiers: LeadTier[]
  industries: string[]
  cities: string[]
  statuses: OutreachStatus[]
}

interface LeadFiltersProps {
  filters: LeadFiltersState
  onChange: (filters: LeadFiltersState) => void
  onReset: () => void
}

const TIERS: LeadTier[] = ['A', 'B', 'C']
const TIER_COLORS: Record<LeadTier, string> = {
  A: 'var(--tier-a)',
  B: 'var(--tier-b)',
  C: 'var(--tier-c)',
}

function TierChip({ tier, active, onClick }: { tier: LeadTier; active: boolean; onClick: () => void }) {
  const color = TIER_COLORS[tier]
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        background: active ? `${color}20` : 'transparent',
        color: active ? color : 'var(--text-muted)',
        transition: 'all 150ms ease-out',
      }}
    >
      {tier}
    </button>
  )
}

export function LeadFilters({ filters, onChange, onReset }: LeadFiltersProps) {
  function toggleTier(tier: LeadTier) {
    const next = filters.tiers.includes(tier)
      ? filters.tiers.filter(t => t !== tier)
      : [...filters.tiers, tier]
    onChange({ ...filters, tiers: next })
  }

  const hasFilters = filters.tiers.length > 0 || filters.industries.length > 0 || filters.cities.length > 0 || filters.statuses.length > 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 20,
      }}
    >
      {/* Tier chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onChange({ ...filters, tiers: [] })}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            border: `1px solid ${filters.tiers.length === 0 ? 'var(--electric)' : 'var(--border)'}`,
            background: filters.tiers.length === 0 ? 'rgba(0, 217, 255, 0.1)' : 'transparent',
            color: filters.tiers.length === 0 ? 'var(--electric)' : 'var(--text-muted)',
            transition: 'all 150ms ease-out',
          }}
        >
          All
        </button>
        {TIERS.map(tier => (
          <TierChip
            key={tier}
            tier={tier}
            active={filters.tiers.includes(tier)}
            onClick={() => toggleTier(tier)}
          />
        ))}
      </div>

      {/* Industry dropdown */}
      <select
        multiple={false}
        value={filters.industries[0] ?? ''}
        onChange={e => {
          const val = e.target.value
          onChange({ ...filters, industries: val ? [val] : [] })
        }}
        style={filterSelectStyle}
      >
        <option value="" style={{ background: 'var(--panel)' }}>All industries</option>
        {INDUSTRIES.map(ind => (
          <option key={ind.key} value={ind.key} style={{ background: 'var(--panel)' }}>
            {ind.label}
          </option>
        ))}
      </select>

      {/* City dropdown */}
      <select
        value={filters.cities[0] ?? ''}
        onChange={e => {
          const val = e.target.value
          onChange({ ...filters, cities: val ? [val] : [] })
        }}
        style={filterSelectStyle}
      >
        <option value="" style={{ background: 'var(--panel)' }}>All cities</option>
        {CITY_GROUPS.map(group => (
          <optgroup key={group.region} label={group.region} style={{ color: 'var(--text-muted)' }}>
            {group.cities.map(city => (
              <option key={city} value={city} style={{ background: 'var(--panel)' }}>
                {cityDisplayName(city)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Status dropdown */}
      <select
        value={filters.statuses[0] ?? ''}
        onChange={e => {
          const val = e.target.value as OutreachStatus
          onChange({ ...filters, statuses: val ? [val] : [] })
        }}
        style={filterSelectStyle}
      >
        <option value="" style={{ background: 'var(--panel)' }}>All statuses</option>
        {Object.entries(OUTREACH_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value} style={{ background: 'var(--panel)' }}>
            {label}
          </option>
        ))}
      </select>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 13,
            padding: '4px 0',
            textDecoration: 'underline',
          }}
        >
          Reset filters
        </button>
      )}
    </div>
  )
}

const filterSelectStyle: React.CSSProperties = {
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '5px 10px',
  fontSize: 12,
  color: 'var(--text-secondary)',
  outline: 'none',
  cursor: 'pointer',
}
