import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { INDUSTRIES } from '@/lib/scraper/industries'
import { estimateCost } from '@/lib/scraper/google-places'

export const runtime = 'nodejs'

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

  // Build the full query matrix
  const queueItems: Array<{
    industry_key: string
    industry_label: string
    city: string
    query: string
    status: string
  }> = []

  for (const industry of selectedIndustries) {
    for (const city of cities) {
      for (const queryTerm of industry.queries) {
        queueItems.push({
          industry_key: industry.key,
          industry_label: industry.label,
          city,
          query: queryTerm,
          status: 'PENDING',
        })
      }
    }
  }

  const totalQueries = queueItems.length
  const estimatedCost = estimateCost(totalQueries)

  // Create the scrape_runs row
  const { data: run, error: runError } = await supabase
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

  if (runError) {
    return NextResponse.json({ error: runError.message }, { status: 500 })
  }

  // Insert queue items in one batch
  const { error: queueError } = await supabase
    .from('scrape_queue')
    .insert(queueItems.map(item => ({ ...item, run_id: run.id })))

  if (queueError) {
    // Roll back the run row on queue insert failure
    await supabase.from('scrape_runs').delete().eq('id', run.id)
    return NextResponse.json({ error: queueError.message }, { status: 500 })
  }

  return NextResponse.json({
    run_id: run.id,
    total_queries: totalQueries,
    estimated_cost: estimatedCost,
  })
}
