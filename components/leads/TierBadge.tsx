import type { LeadTier } from '@/lib/types'

const TIER_CONFIG = {
  A: { bg: '#FF3B30', label: 'A' },
  B: { bg: '#FF9500', label: 'B' },
  C: { bg: '#71717A', label: 'C' },
}

interface TierBadgeProps {
  tier: LeadTier
  size?: 'sm' | 'md'
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier]
  const isSmall = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: config.bg,
        color: '#fff',
        borderRadius: 6,
        padding: isSmall ? '2px 6px' : '3px 8px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1,
        minWidth: isSmall ? 22 : 26,
      }}
    >
      {config.label}
    </span>
  )
}
