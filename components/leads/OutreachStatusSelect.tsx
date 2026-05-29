'use client'

import { OUTREACH_STATUS_LABELS, type OutreachStatus } from '@/lib/types'
import { outreachStatusColor } from '@/lib/utils'
import { useUpdateStatus } from '@/hooks/useLeads'
import { toast } from 'sonner'

const ALL_STATUSES: OutreachStatus[] = [
  'NEW', 'CONTACTED', 'REPLIED', 'INTERESTED',
  'MEETING_BOOKED', 'CLOSED_WON', 'CLOSED_LOST', 'DO_NOT_CONTACT',
]

interface OutreachStatusSelectProps {
  leadId: string
  status: OutreachStatus
  compact?: boolean
}

export function OutreachStatusSelect({ leadId, status, compact = false }: OutreachStatusSelectProps) {
  const updateStatus = useUpdateStatus()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as OutreachStatus
    try {
      await updateStatus.mutateAsync({ id: leadId, status: newStatus })
    } catch {
      toast.error('Failed to update status')
    }
  }

  const color = outreachStatusColor(status)

  return (
    <select
      value={status}
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      style={{
        background: 'transparent',
        border: `1px solid ${color}30`,
        borderRadius: 6,
        padding: compact ? '3px 6px' : '5px 8px',
        fontSize: compact ? 11 : 12,
        color: color,
        fontWeight: 500,
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        WebkitAppearance: 'none',
        paddingRight: compact ? 16 : 24,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 4px center',
        backgroundSize: '10px',
      }}
    >
      {ALL_STATUSES.map(s => (
        <option
          key={s}
          value={s}
          style={{ background: 'var(--panel)', color: 'var(--text-primary)' }}
        >
          {OUTREACH_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
