import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest, after } from 'next/server'
import { INDUSTRIES } from '@/lib/scraper/industries'
import { textSearch, getPlaceDetails, estimateCost } from '@/lib/scraper/google-places'
import { scoreBusiness } from '@/lib/scraper/scoring-engine'
import type { ScoringWeights, TierThresholds } from '@/lib/types'

async function runScrape(runId: string, industries: string[], cities: string[]) {
  const supabase = await createServiceClient()
  const apiKey = process.env.GOOGLE_PLACES_API_KEY!

  await supabase
    .from('scrape_runs')
    .update({ status: 'RUNNING', started_at: new Date().toISOString() })
    .eq('id', runId)

  // Load scoring settings
  const { data: weightsSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'scoring_weights')
    .single()
  const { data: thresholdsSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'tier_thresholds')
    .single()

  const weights: ScoringWeights = weightsSetting?.value ?? {}
  const thresholds: TierThresholds = thresholdsSetting?.value ?? { A: 70, B: 45 }

  const selectedIndustries = INDUSTRIES.filter(i => industries.includes(i.key))
  let completedQueries = 0
  let leadsFound = 0
  let newLeads = 0
  let actualCost = 0

  try {
    for (const industry of selectedIndustries) {
      for (const city of cities) {
        for (const queryTerm of industry.queries) {
          try {
            const results = await textSearch(queryTerm, city, apiKey)
            actualCost += 0.032

            for (const result of results) {
              leadsFound++
              // Check if already exists
              const { data: existing } = await supabase
                .from('leads')
                .select('id')
                .eq('place_id', result.place_id)
                .single()

              if (!existing) {
                try {
                  const details = await getPlaceDetails(result.place_id, apiKey)
                  actualCost += 0.017

                  const { score, tier, breakdown, notes } = scoreBusiness(details, weights, thresholds)

                  const cityName = city
                  const industryLabel = industry.label

                  await supabase.from('leads').insert({
                    place_id: details.place_id,
                    name: details.name,
                    industry_key: industry.key,
                    industry_label: industryLabel,
                    city: cityName,
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
                  newLeads++
                } catch (detailsErr) {
                  console.error('Place details error:', detailsErr)
                }
              }
            }
          } catch (queryErr) {
            console.error('Text search error:', queryErr)
          }

          completedQueries++
          // Update progress
          await supabase
            .from('scrape_runs')
            .update({
              completed_queries: completedQueries,
              leads_found: leadsFound,
              new_leads: newLeads,
              actual_cost_usd: actualCost,
            })
            .eq('id', runId)
        }
      }
    }

    await supabase
      .from('scrape_runs')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        leads_found: leadsFound,
        new_leads: newLeads,
        actual_cost_usd: actualCost,
        completed_queries: completedQueries,
      })
      .eq('id', runId)
  } catch (err) {
    await supabase
      .from('scrape_runs')
      .update({
        status: 'FAILED',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { industries, cities } = await request.json()

  if (!industries?.length || !cities?.length) {
    return NextResponse.json(
      { error: 'At least one industry and one city required' },
      { status: 400 },
    )
  }

  const selectedIndustries = INDUSTRIES.filter(i => industries.includes(i.key))
  const totalQueries = selectedIndustries.reduce(
    (sum, ind) => sum + ind.queries.length * cities.length,
    0,
  )
  const estimatedCost = estimateCost(totalQueries)

  const { data: run, error } = await supabase
    .from('scrape_runs')
    .insert({
      status: 'PENDING',
      industries,
      cities,
      total_queries: totalQueries,
      estimated_cost_usd: estimatedCost,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire and forget using `after` (Next.js 15+) or fallback
  after(async () => {
    await runScrape(run.id, industries, cities)
  })

  return NextResponse.json({ run_id: run.id, total_queries: totalQueries, estimated_cost: estimatedCost })
}
