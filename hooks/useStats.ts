import { useQuery } from '@tanstack/react-query'
import type { DashboardStats } from '@/lib/types'

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}
