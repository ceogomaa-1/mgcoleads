export type LeadTier = 'A' | 'B' | 'C'

export type OutreachStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'MEETING_BOOKED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'DO_NOT_CONTACT'

export type ScrapeRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface ScoreSignal {
  signal: string
  points: number
  reason: string
}

export interface Lead {
  id: string
  place_id: string
  name: string
  industry_key: string
  industry_label: string
  city: string
  formatted_address: string | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  rating: number | null
  review_count: number
  score: number
  tier: LeadTier
  score_breakdown: ScoreSignal[]
  notes: string | null
  raw_data: Record<string, unknown> | null
  outreach_status: OutreachStatus
  outreach_notes: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}

export interface ScrapeRun {
  id: string
  status: ScrapeRunStatus
  industries: string[]
  cities: string[]
  total_queries: number
  completed_queries: number
  leads_found: number
  new_leads: number
  estimated_cost_usd: number
  actual_cost_usd: number
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export interface OutreachHistoryEntry {
  id: string
  lead_id: string
  action: 'called' | 'emailed' | 'sms' | 'meeting'
  outcome: string | null
  notes: string | null
  created_at: string
}

export interface ScoringWeights {
  no_website: number
  weak_website: number
  low_rating: number
  very_low_rating: number
  few_reviews: number
  no_booking_link: number
  phone_listed: number
  extended_hours: number
  few_photos: number
  recently_active: number
  missed_call_reviews: number
}

export interface TierThresholds {
  A: number
  B: number
}

export interface DashboardStats {
  total_leads: number
  tier_a_leads: number
  tier_b_leads: number
  tier_c_leads: number
  contacted_this_week: number
  conversion_rate: number
  new_uncontacted: number
}

export interface GooglePlaceDetails {
  place_id: string
  name: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  url?: string
  rating?: number
  user_ratings_total?: number
  opening_hours?: {
    open_now?: boolean
    periods?: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
    weekday_text?: string[]
  }
  photos?: Array<{ photo_reference: string; height: number; width: number }>
  reviews?: Array<{
    author_name: string
    rating: number
    relative_time_description: string
    text: string
    time: number
  }>
  types?: string[]
  business_status?: string
}

export interface LeadFilters {
  search: string
  tiers: LeadTier[]
  industries: string[]
  cities: string[]
  statuses: OutreachStatus[]
}

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  REPLIED: 'Replied',
  INTERESTED: 'Interested',
  MEETING_BOOKED: 'Meeting Booked',
  CLOSED_WON: 'Won',
  CLOSED_LOST: 'Lost',
  DO_NOT_CONTACT: 'Do Not Contact',
}

export const OUTREACH_ACTIONS = [
  { value: 'called', label: 'Phone Call' },
  { value: 'emailed', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'meeting', label: 'Meeting' },
] as const

export const OUTREACH_OUTCOMES = [
  { value: 'no_answer', label: 'No Answer' },
  { value: 'left_voicemail', label: 'Left Voicemail' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'call_back', label: 'Call Back Later' },
  { value: 'meeting_set', label: 'Meeting Set' },
  { value: 'rejected', label: 'Rejected' },
] as const
