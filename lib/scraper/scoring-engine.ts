import type { GooglePlaceDetails, ScoreSignal, ScoringWeights, TierThresholds, LeadTier } from '../types'

const BOOKING_KEYWORDS = ['book', 'appoint', 'schedul', 'calendly', 'jane', 'mindbody', 'reserv', 'online-booking']

const PAIN_PHRASES = [
  "didn't answer",
  "no one picks up",
  "left a message",
  "never called back",
  "voicemail",
  "hard to reach",
  "couldn't reach",
  "no response",
  "never responded",
  "goes to voicemail",
  "unreachable",
  "never answers",
  "left messages",
  "no callback",
]

const DEFAULT_WEIGHTS: ScoringWeights = {
  no_website: 20,
  weak_website: 10,
  low_rating: 10,
  very_low_rating: 15,
  few_reviews: 10,
  no_booking_link: 12,
  phone_listed: 8,
  extended_hours: 10,
  few_photos: 10,
  recently_active: 5,
  missed_call_reviews: 15,
}

const DEFAULT_THRESHOLDS: TierThresholds = { A: 70, B: 45 }

export interface ScoringResult {
  score: number
  tier: LeadTier
  breakdown: ScoreSignal[]
  notes: string
}

export function scoreBusiness(
  place: GooglePlaceDetails,
  weights: Partial<ScoringWeights> = {},
  thresholds: TierThresholds = DEFAULT_THRESHOLDS,
): ScoringResult {
  const w = { ...DEFAULT_WEIGHTS, ...weights }
  const breakdown: ScoreSignal[] = []
  const painNotes: string[] = []
  let rawScore = 0

  // 1. No website
  if (!place.website) {
    rawScore += w.no_website
    breakdown.push({ signal: 'no_website', points: w.no_website, reason: 'No website found — no digital presence' })
    painNotes.push('No website detected. Likely missing online booking, quote forms, and credibility.')
  } else {
    // 2. Weak website (no booking keyword)
    const urlLower = place.website.toLowerCase()
    const hasBooking = BOOKING_KEYWORDS.some(kw => urlLower.includes(kw))
    if (!hasBooking) {
      rawScore += w.weak_website
      breakdown.push({ signal: 'weak_website', points: w.weak_website, reason: 'Website lacks booking/scheduling keywords' })
      painNotes.push('Website doesn\'t appear to have online booking — customers likely call to book, causing missed leads.')
    }
  }

  // 3. Rating signals
  const rating = place.rating
  if (rating !== undefined && rating !== null) {
    if (rating < 3.5) {
      rawScore += w.very_low_rating
      breakdown.push({ signal: 'very_low_rating', points: w.very_low_rating, reason: `Rating ${rating}/5 — severely underperforming` })
      painNotes.push(`Low Google rating (${rating}/5) suggests customer experience issues and reputation damage.`)
    } else if (rating < 4.2) {
      rawScore += w.low_rating
      breakdown.push({ signal: 'low_rating', points: w.low_rating, reason: `Rating ${rating}/5 — below average` })
      painNotes.push(`Below-average rating (${rating}/5) — competitors with better reviews are stealing leads.`)
    }
  }

  // 4. Few reviews
  const reviewCount = place.user_ratings_total ?? 0
  if (reviewCount < 50) {
    rawScore += w.few_reviews
    breakdown.push({ signal: 'few_reviews', points: w.few_reviews, reason: `Only ${reviewCount} reviews — low social proof` })
    painNotes.push(`Low review count (${reviewCount}) — poor social proof hurts conversion.`)
  }

  // 5. Phone listed (positive signal — they CAN be called)
  if (place.formatted_phone_number) {
    rawScore += w.phone_listed
    breakdown.push({ signal: 'phone_listed', points: w.phone_listed, reason: 'Phone number available — direct outreach possible' })
  }

  // 6. Extended hours (open late or weekends)
  const periods = place.opening_hours?.periods ?? []
  const hasExtendedHours = periods.some(p => {
    if (!p.close) return false
    const closeTime = parseInt(p.close.time, 10)
    const isLate = closeTime >= 1800
    const isWeekend = p.open.day === 0 || p.open.day === 6
    return isLate || isWeekend
  })
  if (hasExtendedHours) {
    rawScore += w.extended_hours
    breakdown.push({ signal: 'extended_hours', points: w.extended_hours, reason: 'Extended/weekend hours — high call volume, AI receptionist valuable' })
    painNotes.push('Business has extended or weekend hours — high missed-call risk outside business hours.')
  }

  // 7. Few photos
  const photoCount = place.photos?.length ?? 0
  if (photoCount < 5) {
    rawScore += w.few_photos
    breakdown.push({ signal: 'few_photos', points: w.few_photos, reason: `Only ${photoCount} photos — poor visual presence` })
    painNotes.push(`Minimal photos (${photoCount}) — weak visual presentation damages credibility.`)
  }

  // 8. Recently active (review in last 60 days)
  const sixtyDaysAgo = Date.now() / 1000 - 60 * 24 * 60 * 60
  const hasRecentReview = place.reviews?.some(r => r.time > sixtyDaysAgo) ?? false
  if (hasRecentReview) {
    rawScore += w.recently_active
    breakdown.push({ signal: 'recently_active', points: w.recently_active, reason: 'Recent customer activity — business is active right now' })
  }

  // 9. Missed-call / hard-to-reach reviews
  const allReviewText = (place.reviews ?? []).map(r => r.text.toLowerCase()).join(' ')
  const hasPainPhrases = PAIN_PHRASES.some(phrase => allReviewText.includes(phrase.toLowerCase()))
  if (hasPainPhrases) {
    rawScore += w.missed_call_reviews
    breakdown.push({ signal: 'missed_call_reviews', points: w.missed_call_reviews, reason: 'Reviews mention missed calls / unreachability — perfect AI receptionist candidate' })
    painNotes.push('CRITICAL: Customer reviews explicitly mention missed calls or difficulty reaching the business. AI voice receptionist is a direct solution.')
  }

  const score = Math.min(100, rawScore)
  const tier: LeadTier = score >= thresholds.A ? 'A' : score >= thresholds.B ? 'B' : 'C'
  const notes = painNotes.length > 0 ? painNotes.join('\n\n') : 'No critical pain signals detected.'

  return { score, tier, breakdown, notes }
}
