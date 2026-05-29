'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { INDUSTRIES } from '@/lib/scraper/industries'
import { CITY_GROUPS, cityDisplayName } from '@/lib/cities'
import { estimateCost } from '@/lib/scraper/google-places'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function ScrapePage() {
  const router = useRouter()
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggleIndustry(key: string) {
    setSelectedIndustries(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    )
  }

  function toggleCity(city: string) {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city],
    )
  }

  function selectAllIndustries() {
    setSelectedIndustries(INDUSTRIES.map(i => i.key))
  }

  function selectAllCities() {
    setSelectedCities(CITY_GROUPS.flatMap(g => g.cities))
  }

  // Cost estimation
  const selectedIndustryObjs = INDUSTRIES.filter(i => selectedIndustries.includes(i.key))
  const totalQueries = selectedIndustryObjs.reduce(
    (sum, ind) => sum + ind.queries.length * selectedCities.length,
    0,
  )
  const estimatedCost = estimateCost(totalQueries)

  const canStart = selectedIndustries.length > 0 && selectedCities.length > 0

  async function handleStart() {
    if (!canStart) return
    setLoading(true)
    try {
      const res = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industries: selectedIndustries,
          cities: selectedCities,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Scrape started — leads will appear as they\'re found.')
      router.push('/dashboard/runs')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start scrape')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageHeader
        label="Intelligence"
        title="New Scrape"
        subtitle="Select industries and cities to generate leads."
      />

      {/* Industries */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={sectionLabel}>Industries</p>
          <button onClick={selectAllIndustries} style={selectAllBtn}>
            Select all
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {INDUSTRIES.map(ind => {
            const active = selectedIndustries.includes(ind.key)
            return (
              <button
                key={ind.key}
                onClick={() => toggleIndustry(ind.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--electric)' : 'var(--border)'}`,
                  background: active ? 'rgba(0, 217, 255, 0.1)' : 'var(--panel)',
                  color: active ? 'var(--electric)' : 'var(--text-secondary)',
                  transition: 'all 150ms ease-out',
                }}
              >
                {ind.label}
              </button>
            )
          })}
        </div>
        {selectedIndustries.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            {selectedIndustries.length} selected · {selectedIndustryObjs.reduce((s, i) => s + i.queries.length, 0)} search queries
          </p>
        )}
      </div>

      {/* Cities */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={sectionLabel}>Cities</p>
          <button onClick={selectAllCities} style={selectAllBtn}>
            Select all (29)
          </button>
        </div>

        {CITY_GROUPS.map(group => (
          <div key={group.region} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>
              {group.region}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {group.cities.map(city => {
                const active = selectedCities.includes(city)
                return (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--border-hover)' : 'var(--border)'}`,
                      background: active ? 'var(--panel-hover)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    {cityDisplayName(city)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cost estimator */}
      {canStart && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <p style={sectionLabel}>Cost Estimate</p>
          <div style={{ display: 'flex', gap: 32, marginTop: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Estimated queries</p>
              <p style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {totalQueries.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Estimated API cost</p>
              <p style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {formatCurrency(estimatedCost)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Industries · Cities</p>
              <p style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                {selectedIndustries.length} · {selectedCities.length}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Text Search $0.032/req · Place Details $0.017/req · ~10 results per query
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleStart}
        disabled={!canStart || loading}
        style={{
          width: '100%',
          padding: '12px 24px',
          background: canStart && !loading ? 'var(--electric)' : 'rgba(0, 217, 255, 0.2)',
          color: canStart && !loading ? '#0A0A0B' : 'rgba(0, 217, 255, 0.4)',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          cursor: canStart && !loading ? 'pointer' : 'not-allowed',
          transition: 'all 150ms ease-out',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? 'Starting…' : !canStart ? 'Select industries and cities to start' : `Start Scrape — ${selectedIndustries.length} industries · ${selectedCities.length} cities`}
      </button>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const selectAllBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--electric)',
  fontSize: 12,
  padding: 0,
}
