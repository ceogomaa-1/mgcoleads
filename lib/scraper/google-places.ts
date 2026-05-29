import type { GooglePlaceDetails } from '../types'

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'

export interface TextSearchResult {
  place_id: string
  name: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  types?: string[]
  business_status?: string
}

export interface TextSearchResponse {
  results: TextSearchResult[]
  status: string
  next_page_token?: string
  error_message?: string
}

export async function textSearch(
  query: string,
  city: string,
  apiKey: string,
): Promise<TextSearchResult[]> {
  const params = new URLSearchParams({
    query: `${query} in ${city}`,
    key: apiKey,
    region: 'ca',
    language: 'en',
  })
  const url = `${PLACES_API_BASE}/textsearch/json?${params}`
  const res = await fetch(url)
  const data: TextSearchResponse = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API text search error: ${data.status} — ${data.error_message ?? ''}`)
  }

  return data.results ?? []
}

export async function getPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<GooglePlaceDetails> {
  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'formatted_phone_number',
    'website',
    'url',
    'rating',
    'user_ratings_total',
    'opening_hours',
    'photos',
    'reviews',
    'types',
    'business_status',
  ].join(',')

  const params = new URLSearchParams({ place_id: placeId, fields, key: apiKey })
  const url = `${PLACES_API_BASE}/details/json?${params}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK') {
    throw new Error(`Places API details error: ${data.status}`)
  }

  return data.result as GooglePlaceDetails
}

// Cost estimation
// Text Search: $0.032 per request
// Place Details: $0.017 per request
export const COST_PER_TEXT_SEARCH = 0.032
export const COST_PER_PLACE_DETAILS = 0.017

// On average, a text search returns ~10 results, each needing details
export function estimateCost(totalQueries: number): number {
  const textSearchCost = totalQueries * COST_PER_TEXT_SEARCH
  const detailsCost = totalQueries * 10 * COST_PER_PLACE_DETAILS
  return textSearchCost + detailsCost
}
