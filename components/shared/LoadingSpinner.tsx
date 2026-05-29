export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div
            className="skeleton"
            style={{
              height: 16,
              borderRadius: 4,
              width: i === 0 ? 24 : i === 2 ? '80%' : '60%',
            }}
          />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 4, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 32, width: 120, borderRadius: 4 }} />
    </div>
  )
}

export function SkeletonBlock({ height = 200 }: { height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ height, borderRadius: 12, width: '100%' }}
    />
  )
}
