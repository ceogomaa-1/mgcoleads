import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { startOfWeek } from 'date-fns'

export async function GET() {
  const supabase = await createClient()

  const [
    { count: total_leads },
    { count: tier_a },
    { count: tier_b },
    { count: tier_c },
    { count: contacted_week },
    { count: closed_won },
    { count: total_contacted },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tier', 'A'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tier', 'B'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tier', 'C'),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('last_contacted_at', startOfWeek(new Date()).toISOString()),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('outreach_status', 'CLOSED_WON'),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .neq('outreach_status', 'NEW')
      .neq('outreach_status', 'DO_NOT_CONTACT'),
  ])

  const conversion_rate = total_contacted && total_contacted > 0
    ? Math.round(((closed_won ?? 0) / total_contacted) * 100)
    : 0

  // Count A-tier + uncontacted
  const { count: hot_uncontacted } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tier', 'A')
    .eq('outreach_status', 'NEW')

  return NextResponse.json({
    total_leads: total_leads ?? 0,
    tier_a_leads: tier_a ?? 0,
    tier_b_leads: tier_b ?? 0,
    tier_c_leads: tier_c ?? 0,
    contacted_this_week: contacted_week ?? 0,
    conversion_rate,
    new_uncontacted: hot_uncontacted ?? 0,
  })
}
