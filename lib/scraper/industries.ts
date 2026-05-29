export interface Industry {
  key: string
  label: string
  queries: string[]
}

export const INDUSTRIES: Industry[] = [
  {
    key: 'dental',
    label: 'Dental & Medical',
    queries: [
      'dental clinic',
      'dentist',
      'dental office',
      'medical clinic',
      'family doctor',
      'walk-in clinic',
      'aesthetic clinic',
    ],
  },
  {
    key: 'restaurant',
    label: 'Restaurants & Cafes',
    queries: [
      'restaurant',
      'diner',
      'cafe',
      'bistro',
      'takeout restaurant',
    ],
  },
  {
    key: 'salon',
    label: 'Salons & Beauty',
    queries: [
      'hair salon',
      'nail salon',
      'barbershop',
      'beauty salon',
      'lash studio',
    ],
  },
  {
    key: 'trades',
    label: 'Trades & Contractors',
    queries: [
      'plumber',
      'electrician',
      'HVAC contractor',
      'roofer',
      'general contractor',
      'renovation contractor',
    ],
  },
  {
    key: 'law',
    label: 'Law Firms',
    queries: [
      'law firm',
      'personal injury lawyer',
      'family lawyer',
      'immigration lawyer',
      'criminal defence lawyer',
    ],
  },
  {
    key: 'real_estate',
    label: 'Real Estate',
    queries: [
      'real estate agent',
      'realtor',
      'property management company',
    ],
  },
]

export const INDUSTRY_MAP = new Map(INDUSTRIES.map(i => [i.key, i]))

export function getIndustry(key: string): Industry | undefined {
  return INDUSTRY_MAP.get(key)
}

export function avgQueriesPerIndustry(): number {
  const total = INDUSTRIES.reduce((sum, i) => sum + i.queries.length, 0)
  return total / INDUSTRIES.length
}
