import { scoreColor } from '@/lib/utils'

interface ScoreBarProps {
  score: number
  showNumber?: boolean
}

export function ScoreBar({ score, showNumber = true }: ScoreBarProps) {
  const color = scoreColor(score)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 80 }}>
      {showNumber && (
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: 13,
            fontWeight: 600,
            color: color,
            minWidth: 28,
            textAlign: 'right',
          }}
        >
          {score}
        </span>
      )}
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'var(--border)',
          borderRadius: 2,
          overflow: 'hidden',
          minWidth: 40,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 300ms ease-out',
          }}
        />
      </div>
    </div>
  )
}
