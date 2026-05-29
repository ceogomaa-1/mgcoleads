import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = parseInt(searchParams.get('per_page') ?? '50', 10)
  const search = searchParams.get('search') ?? ''
  const tiers = searchParams.getAll('tier')
  const industries = searchParams.getAll('industry')
  const cities = searchParams.getAll('city')
  const statuses = searchParams.getAll('status')
  const sortBy = searchParams.get('sort_by') ?? 'score'
  const sortDir = searchParams.get('sort_dir') ?? 'desc'

  let query = supabase.from('leads').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,formatted_address.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (tiers.length > 0) query = query.in('tier', tiers)
  if (industries.length > 0) query = query.in('industry_key', industries)
  if (cities.length > 0) query = query.in('city', cities)
  if (statuses.length > 0) query = query.in('outreach_status', statuses)

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  query = query.order(sortBy, { ascending: sortDir === 'asc' }).range(from, to)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data, total: count ?? 0, page, per_page: perPage })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase.from('leads').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data, { status: 201 })
}
