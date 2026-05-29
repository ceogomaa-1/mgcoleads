import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Lead, LeadFilters, OutreachStatus } from '@/lib/types'

interface LeadsResponse {
  leads: Lead[]
  total: number
  page: number
  per_page: number
}

function buildLeadsUrl(filters: Partial<LeadFilters>, page: number, sortBy: string, sortDir: string): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('per_page', '50')
  params.set('sort_by', sortBy)
  params.set('sort_dir', sortDir)
  if (filters.search) params.set('search', filters.search)
  filters.tiers?.forEach(t => params.append('tier', t))
  filters.industries?.forEach(i => params.append('industry', i))
  filters.cities?.forEach(c => params.append('city', c))
  filters.statuses?.forEach(s => params.append('status', s))
  return `/api/leads?${params}`
}

export function useLeads(filters: Partial<LeadFilters> = {}, page = 1, sortBy = 'score', sortDir = 'desc') {
  return useQuery<LeadsResponse>({
    queryKey: ['leads', filters, page, sortBy, sortDir],
    queryFn: async () => {
      const res = await fetch(buildLeadsUrl(filters, page, sortBy, sortDir))
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json()
    },
  })
}

export function useLead(id: string | null) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${id}`)
      if (!res.ok) throw new Error('Failed to fetch lead')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update lead')
      return res.json() as Promise<Lead>
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.setQueryData(['lead', updated.id], updated)
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete lead')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useUpdateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OutreachStatus }) => {
      const update: Partial<Lead> = {
        outreach_status: status,
        ...(status !== 'NEW' && status !== 'DO_NOT_CONTACT'
          ? { last_contacted_at: new Date().toISOString() }
          : {}),
      }
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json() as Promise<Lead>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useTopLeads() {
  return useQuery<Lead[]>({
    queryKey: ['top-leads'],
    queryFn: async () => {
      const res = await fetch('/api/leads?tier=A&sort_by=score&sort_dir=desc&per_page=10&page=1')
      if (!res.ok) throw new Error('Failed to fetch top leads')
      const data = await res.json()
      return data.leads
    },
  })
}
