'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { LeadTable } from '@/components/leads/LeadTable'
import { LeadFilters } from '@/components/leads/LeadFilters'
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer'
import { useLeads } from '@/hooks/useLeads'
import { useSearchStore } from '@/hooks/useSearchStore'
import type { Lead, LeadTier, OutreachStatus } from '@/lib/types'
import { Search } from 'lucide-react'
import Link from 'next/link'

interface FiltersState {
  tiers: LeadTier[]
  industries: string[]
  cities: string[]
  statuses: OutreachStatus[]
}

const DEFAULT_FILTERS: FiltersState = {
  tiers: [],
  industries: [],
  cities: [],
  statuses: [],
}

export function LeadsContent() {
  const searchParams = useSearchParams()
  const { globalSearch, setGlobalSearch } = useSearchStore()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [filters, setFilters] = useState<FiltersState>(() => {
    const tier = searchParams.get('tier') as LeadTier | null
    return {
      ...DEFAULT_FILTERS,
      tiers: tier ? [tier] : [],
    }
  })
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('score')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedLead, setSelectedLead] = useState<string | null>(searchParams.get('lead') ?? null)

  // Sync global search from topbar
  useEffect(() => {
    if (globalSearch) {
      setSearch(globalSearch)
      setGlobalSearch('')
    }
  }, [globalSearch, setGlobalSearch])

  const { data, isLoading } = useLeads(
    { search, ...filters },
    page,
    sortBy,
    sortDir,
  )

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
    setPage(1)
  }

  function handleFiltersChange(next: FiltersState) {
    setFilters(next)
    setPage(1)
  }

  return (
    <>
      <PageHeader
        label="Pipeline"
        title="Leads"
        subtitle={`${(data?.total ?? 0).toLocaleString()} total leads`}
        actions={
          <Link
            href="/scrape"
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

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 16 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, address, phone…"
          style={{
            width: '100%',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px 8px 32px',
            fontSize: 13,
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 150ms ease-out',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--electric)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      <LeadFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1) }}
      />

      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <LeadTable
          leads={data?.leads ?? []}
          total={data?.total ?? 0}
          page={page}
          isLoading={isLoading}
          onPageChange={setPage}
          onRowClick={(lead: Lead) => setSelectedLead(lead.id)}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </div>

      <LeadDetailDrawer
        leadId={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </>
  )
}
