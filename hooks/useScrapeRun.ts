import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ScrapeRun } from '@/lib/types'
import { useEffect } from 'react'

export function useScrapeRun(runId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery<ScrapeRun>({
    queryKey: ['scrape-run', runId],
    queryFn: async () => {
      const res = await fetch(`/api/scrape/status/${runId}`)
      if (!res.ok) throw new Error('Failed to fetch run')
      return res.json()
    },
    enabled: !!runId,
    refetchInterval: (q) => {
      const data = q.state.data
      if (!data) return 2000
      if (data.status === 'RUNNING' || data.status === 'PENDING') return 2000
      return false
    },
  })

  // When run completes, invalidate leads
  useEffect(() => {
    if (query.data?.status === 'COMPLETED') {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['scrape-runs'] })
    }
  }, [query.data?.status, queryClient])

  return query
}

export function useScrapeRuns() {
  return useQuery<ScrapeRun[]>({
    queryKey: ['scrape-runs'],
    queryFn: async () => {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
  })
}
