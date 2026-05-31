import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { textSearch, getPlaceDetails, COST_PER_TEXT_SEARCH, COST_PER_PLACE_DETAILS } from '@/lib/scraper/google-places'
import { scoreBusiness } from '@/lib/scraper/scoring-engine'
import type { ScoringWeights, TierThresholds } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { run_id } = await request.json()

  if (!run_id) {
    return NextResponse.json({ error: 'run_id required' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  // Claim the next PENDING queue item (ordered by creation to work through them in sequence)
  const { data: item } = await supabase
    .from('scrape_queue')
    .select('*')
    .eq('run_id', run_id)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!item) {
    // No pending items left — check if anything is still processing (race guard)
    const { count: processing } = await supabase
      .from('scrape_queue')
      .select('*', { count: 'exact', head: true })
      .eq('run_id', run_id)
      .eq('status', 'PROCESSING')

    if (!processing || processing === 0) {
      await supabase
        .from('scrape_runs')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('id', run_id)
        .in('status', ['PENDING', 'RUNNING'])
    }

    return NextResponse.json({ done: true })
  }

  // Mark this item as PROCESSING and transition run to RUNNING on first item
  await Promise.all([
    supabase
      .from('scrape_queue')
      .update({ status: 'PROCESSING', attempts: item.attempts + 1 })
      .eq('id', item.id),
    supabase
      .from('scrape_runs')
      .update({ status: 'RUNNING', started_at: new Date().toISOString() })
      .eq('id', run_id)
      .eq('status', 'PENDING'),
  ])

  // Load scoring config
  const [{ data: weightsSetting }, { data: thresholdsSetting }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'scoring_weights').single(),
    supabase.from('settings').select('value').eq('key', 'tier_thresholds').single(),
  ])
  const weights: ScoringWeights = weightsSetting?.value ?? {}
  const thresholds: TierThresholds = thresholdsSetting?.value ?? { A: 70, B: 45 }

  let leadsFound = 0
  let newLeads = 0
  let cost = 0
  let itemStatus = 'COMPLETED'
  let itemError: string | null = null

  try {
    const results = await textSearch(item.query, item.city, apiKey)
    cost += COST_PER_TEXT_SEARCH
    leadsFound = results.length

    for (const result of results) {
      try {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('place_id', result.place_id)
          .maybeSingle()

        if (existing) continue

        const details = await getPlaceDetails(result.place_id, apiKey)
        cost += COST_PER_PLACE_DETAILS

        const { score, tier, breakdown, notes } = scoreBusiness(details, weights, thresholds)

        const { error: insertError } = await supabase.from('leads').insert({
          place_id: details.place_id,
          name: details.name,
          industry_key: item.industry_key,
          industry_label: item.industry_label,
          city: item.city,
          formatted_address: details.formatted_address ?? null,
          phone: details.formatted_phone_number ?? null,
          website: details.website ?? null,
          google_maps_url: details.url ?? null,
          rating: details.rating ?? null,
          review_count: details.user_ratings_total ?? 0,
          score,
          tier,
          score_breakdown: breakdown,
          notes,
          raw_data: details as unknown as Record<string, unknown>,
          outreach_status: 'NEW',
        })

        if (!insertError) newLeads++
      } catch (detailErr) {
        console.error('Place detail error:', detailErr)
      }
    }
  } catch (err) {
    console.error('Text search error for query', item.query, err)
    itemStatus = 'FAILED'
    itemError = err instanceof Error ? err.message : 'Unknown error'
    leadsFound = 0
  }

  // Get current run counters (sequential polling, no concurrency risk)
  const { data: currentRun } = await supabase
    .from('scrape_runs')
    .select('completed_queries, leads_found, new_leads, actual_cost_usd')
    .eq('id', run_id)
    .single()

  await Promise.all([
    supabase
      .from('scrape_queue')
      .update({
        status: itemStatus,
        processed_at: new Date().toISOString(),
        error_message: itemError,
      })
      .eq('id', item.id),
    supabase
      .from('scrape_runs')
      .update({
        completed_queries: (currentRun?.completed_queries ?? 0) + 1,
        leads_found: (currentRun?.leads_found ?? 0) + leadsFound,
        new_leads: (currentRun?.new_leads ?? 0) + newLeads,
        actual_cost_usd: (currentRun?.actual_cost_usd ?? 0) + cost,
      })
      .eq('id', run_id),
  ])

  // Count remaining for progress reporting
  const { count: remaining } = await supabase
    .from('scrape_queue')
    .select('*', { count: 'exact', head: true })
    .eq('run_id', run_id)
    .eq('status', 'PENDING')

  return NextResponse.json({
    done: false,
    processed: 1,
    leads_found: leadsFound,
    new_leads: newLeads,
    remaining: remaining ?? 0,
    cost,
  })
}
