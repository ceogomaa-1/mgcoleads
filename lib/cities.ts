export interface CityGroup {
  region: string
  cities: string[]
}

export const CITY_GROUPS: CityGroup[] = [
  {
    region: 'Durham',
    cities: [
      'Oshawa, Ontario',
      'Whitby, Ontario',
      'Ajax, Ontario',
      'Pickering, Ontario',
      'Clarington, Ontario',
      'Uxbridge, Ontario',
      'Scugog, Ontario',
    ],
  },
  {
    region: 'Toronto',
    cities: [
      'Toronto, Ontario',
      'Scarborough, Ontario',
      'North York, Ontario',
      'Etobicoke, Ontario',
      'East York, Ontario',
    ],
  },
  {
    region: 'York',
    cities: [
      'Markham, Ontario',
      'Vaughan, Ontario',
      'Richmond Hill, Ontario',
      'Newmarket, Ontario',
      'Aurora, Ontario',
      'King City, Ontario',
      'Stouffville, Ontario',
    ],
  },
  {
    region: 'Simcoe',
    cities: [
      'Barrie, Ontario',
      'Innisfil, Ontario',
      'Bradford, Ontario',
    ],
  },
  {
    region: 'Peel',
    cities: [
      'Brampton, Ontario',
      'Mississauga, Ontario',
      'Caledon, Ontario',
    ],
  },
  {
    region: 'Halton',
    cities: [
      'Oakville, Ontario',
      'Burlington, Ontario',
      'Milton, Ontario',
      'Halton Hills, Ontario',
    ],
  },
]

export const ALL_CITIES: string[] = CITY_GROUPS.flatMap(g => g.cities)

export function cityDisplayName(city: string): string {
  return city.replace(', Ontario', '')
}
