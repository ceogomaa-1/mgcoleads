import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('outreach_history')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { data: history, error: histError } = await supabase
    .from('outreach_history')
    .insert({ lead_id: id, ...body })
    .select()
    .single()

  if (histError) return NextResponse.json({ error: histError.message }, { status: 400 })

  // Update last_contacted_at on lead
  await supabase
    .from('leads')
    .update({ last_contacted_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json(history, { status: 201 })
}
