'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface TierDistributionChartProps {
  tierA: number
  tierB: number
  tierC: number
}

const TIER_DATA = [
  { key: 'A', label: 'Tier A — Hot', color: '#FF3B30' },
  { key: 'B', label: 'Tier B — Warm', color: '#FF9500' },
  { key: 'C', label: 'Tier C — Cold', color: '#71717A' },
]

export function TierDistributionChart({ tierA, tierB, tierC }: TierDistributionChartProps) {
  const total = tierA + tierB + tierC
  const data = [
    { name: 'Tier A', value: tierA },
    { name: 'Tier B', value: tierB },
    { name: 'Tier C', value: tierC },
  ]

  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No leads yet</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={TIER_DATA[i].color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
            formatter={(value, name) => [
              `${Number(value).toLocaleString()} (${Math.round((Number(value) / total) * 100)}%)`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {TIER_DATA.map((tier, i) => {
          const val = [tierA, tierB, tierC][i]
          return (
            <div key={tier.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: tier.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tier.label}</span>
              </div>
              <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', fontWeight: 600 }}>
                {val.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
