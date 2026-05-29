import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { LeadTier, OutreachStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone
}

export function formatDomain(url: string | null | undefined): string {
  if (!url) return '—'
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function tierColor(tier: LeadTier): string {
  switch (tier) {
    case 'A': return 'var(--tier-a)'
    case 'B': return 'var(--tier-b)'
    case 'C': return 'var(--tier-c)'
  }
}

export function scoreColor(score: number): string {
  if (score >= 70) return 'var(--tier-a)'
  if (score >= 45) return 'var(--tier-b)'
  return 'var(--tier-c)'
}

export function outreachStatusColor(status: OutreachStatus): string {
  switch (status) {
    case 'NEW': return '#52525B'
    case 'CONTACTED': return '#00D9FF'
    case 'REPLIED': return '#00D9FF'
    case 'INTERESTED': return '#FF9500'
    case 'MEETING_BOOKED': return '#FF9500'
    case 'CLOSED_WON': return '#30D158'
    case 'CLOSED_LOST': return '#FF453A'
    case 'DO_NOT_CONTACT': return '#FF453A'
    default: return '#52525B'
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '—'
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds % 60}s`
}

export function exportLeadsToCSV(leads: import('./types').Lead[]): void {
  const headers = [
    'Name', 'Industry', 'City', 'Score', 'Tier', 'Phone', 'Website',
    'Rating', 'Reviews', 'Status', 'Last Contacted', 'Address',
  ]
  const rows = leads.map(l => [
    l.name,
    l.industry_label,
    l.city,
    l.score,
    l.tier,
    l.phone ?? '',
    l.website ?? '',
    l.rating ?? '',
    l.review_count,
    l.outreach_status,
    l.last_contacted_at ?? '',
    l.formatted_address ?? '',
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mgcoleads-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
