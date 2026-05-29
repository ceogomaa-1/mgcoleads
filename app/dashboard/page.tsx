'use client'

import { StatCard, StatCardSkeleton } from '@/components/dashboard/StatCard'
import { TierDistributionChart } from '@/components/dashboard/TierDistributionChart'
import { TopHotLeads } from '@/components/dashboard/TopHotLeads'
import { RecentRunsTable } from '@/components/dashboard/RecentRunsTable'
import { useStats } from '@/hooks/useStats'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats()

  return (
    <div>
      {/* Operation command header */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          Operation Command
        </p>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {isLoading ? (
            <span className="skeleton" style={{ display: 'inline-block', height: 28, width: 400, borderRadius: 4 }} />
          ) : (
            <>
              <span style={{ color: 'var(--tier-a)', fontVariantNumeric: 'tabular-nums' }}>
                {(stats?.new_uncontacted ?? 0).toLocaleString()}
              </span>{' '}
              hot leads waiting.{' '}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 18 }}>
                {(stats?.tier_a_leads ?? 0).toLocaleString()} Tier A total.
              </span>
            </>
          )}
        </h1>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
        className="max-lg:grid-cols-2 max-sm:grid-cols-1"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Leads"
              value={stats?.total_leads ?? 0}
            />
            <StatCard
              label="Tier A — Hot"
              value={stats?.tier_a_leads ?? 0}
              highlight
              highlightColor="var(--tier-a)"
            />
            <StatCard
              label="Contacted This Week"
              value={stats?.contacted_this_week ?? 0}
              highlight
              highlightColor="var(--electric)"
            />
            <StatCard
              label="Conversion Rate"
              value={stats?.conversion_rate ?? 0}
              suffix="%"
              highlight={!!stats?.conversion_rate}
              highlightColor="var(--success)"
            />
          </>
        )}
      </div>

      {/* Two-column section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 24,
          marginBottom: 32,
        }}
        className="max-lg:grid-cols-1"
      >
        {/* Top 10 hot leads */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Top 10 Hot Leads
            </p>
            <Link
              href="/dashboard/leads?tier=A"
              style={{ fontSize: 12, color: 'var(--electric)', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>
          <TopHotLeads />
        </div>

        {/* Tier distribution */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 16,
            }}
          >
            Tier Distribution
          </p>
          {isLoading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
          ) : (
            <TierDistributionChart
              tierA={stats?.tier_a_leads ?? 0}
              tierB={stats?.tier_b_leads ?? 0}
              tierC={stats?.tier_c_leads ?? 0}
            />
          )}
        </div>
      </div>

      {/* Recent runs */}
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Recent Scrape Runs
          </p>
        </div>
        <div style={{ padding: '12px 20px' }}>
          <RecentRunsTable />
        </div>
      </div>
    </div>
  )
}
