interface StatCardProps {
  label: string
  value: number | string
  highlight?: boolean
  highlightColor?: string
  suffix?: string
}

export function StatCard({ label, value, highlight, highlightColor = 'var(--electric)', suffix }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: `1px solid ${highlight ? highlightColor + '30' : 'var(--border)'}`,
        borderRadius: 12,
        padding: 24,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          color: highlight ? highlightColor : 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && (
          <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </p>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 3, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 36, width: 100, borderRadius: 4 }} />
    </div>
  )
}
