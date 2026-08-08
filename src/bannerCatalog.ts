import type { Rarity } from './wishMath'

export type BannerType = 'character' | 'weapon' | 'standard'
export type ItemType = 'character' | 'weapon'
export type Accent = 'solar' | 'lunar' | 'verdant' | 'tidal' | 'ember' | 'violet' | 'aero' | 'frost'

export interface CatalogItem {
  id: string
  name: string
  title: string
  type: ItemType
  rarity: Rarity
  accent: Accent
  sigil: string
}

export interface BannerDefinition {
  id: BannerType
  name: string
  subtitle: string
  description: string
  featuredIds: string[]
  poolIds: string[]
  hardPity: number
  baseRate: number
}

export const catalog: CatalogItem[] = [
  { id: 'solenne', name: 'Solenne', title: 'Keeper of the Dawn Archive', type: 'character', rarity: 5, accent: 'solar', sigil: '☀' },
  { id: 'vesper', name: 'Vesper', title: 'Cartographer of Quiet Stars', type: 'character', rarity: 5, accent: 'lunar', sigil: '☾' },
  { id: 'mirelle', name: 'Mirelle', title: 'Voice Beneath the Tides', type: 'character', rarity: 5, accent: 'tidal', sigil: '≋' },
  { id: 'rowan', name: 'Rowan', title: 'Warden of the Glasswood', type: 'character', rarity: 5, accent: 'verdant', sigil: '♧' },
  { id: 'cael', name: 'Cael', title: 'Courier of the High Current', type: 'character', rarity: 4, accent: 'aero', sigil: '⌁' },
  { id: 'nyra', name: 'Nyra', title: 'Ink of the Violet Hour', type: 'character', rarity: 4, accent: 'violet', sigil: '✣' },
  { id: 'orren', name: 'Orren', title: 'The Hearthbound Bell', type: 'character', rarity: 4, accent: 'ember', sigil: '♨' },
  { id: 'isel', name: 'Isel', title: 'Winterglass Artisan', type: 'character', rarity: 4, accent: 'frost', sigil: '❄' },
  { id: 'tavia', name: 'Tavia', title: 'Keeper of Small Horizons', type: 'character', rarity: 4, accent: 'solar', sigil: '✺' },
  { id: 'astral-codex', name: 'Astral Codex', title: 'Catalyst · A map that writes back', type: 'weapon', rarity: 5, accent: 'solar', sigil: '⌘' },
  { id: 'moonspun-edge', name: 'Moonspun Edge', title: 'Sword · Tempered in blue silence', type: 'weapon', rarity: 5, accent: 'lunar', sigil: '†' },
  { id: 'verdant-oath', name: 'Verdant Oath', title: 'Polearm · Root and star entwined', type: 'weapon', rarity: 5, accent: 'verdant', sigil: '↟' },
  { id: 'tidemark-bow', name: 'Tidemark Bow', title: 'Bow · Follows the returning sea', type: 'weapon', rarity: 4, accent: 'tidal', sigil: '⌒' },
  { id: 'emberglass', name: 'Emberglass', title: 'Catalyst · Holds a patient flame', type: 'weapon', rarity: 4, accent: 'ember', sigil: '◇' },
  { id: 'northwind-blade', name: 'Northwind Blade', title: 'Sword · Light as first snow', type: 'weapon', rarity: 4, accent: 'frost', sigil: '╱' },
  { id: 'violet-interval', name: 'Violet Interval', title: 'Claymore · Thunder between notes', type: 'weapon', rarity: 4, accent: 'violet', sigil: '▰' },
  { id: 'wayfarer-pike', name: 'Wayfarer Pike', title: 'Polearm · Points beyond the chart', type: 'weapon', rarity: 4, accent: 'aero', sigil: '↑' },
  { id: 'iron-comet', name: 'Iron Comet', title: 'Weapon · A common travelling star', type: 'weapon', rarity: 3, accent: 'aero', sigil: '◆' },
  { id: 'blue-hour', name: 'Blue Hour', title: 'Weapon · Catches the evening light', type: 'weapon', rarity: 3, accent: 'tidal', sigil: '◇' },
  { id: 'field-notes', name: 'Field Notes', title: 'Weapon · Observations from afar', type: 'weapon', rarity: 3, accent: 'verdant', sigil: '▱' },
]

export const banners: BannerDefinition[] = [
  {
    id: 'character', name: 'Dawn Archive', subtitle: 'Character Event Signal',
    description: 'Featured observer Solenne with three elevated 4★ companions.',
    featuredIds: ['solenne', 'cael', 'nyra', 'orren'],
    poolIds: ['solenne', 'vesper', 'mirelle', 'rowan', 'cael', 'nyra', 'orren', 'isel', 'tavia', 'tidemark-bow', 'emberglass', 'northwind-blade', 'violet-interval', 'wayfarer-pike', 'iron-comet', 'blue-hour', 'field-notes'],
    hardPity: 90, baseRate: 0.006,
  },
  {
    id: 'weapon', name: 'Instruments of Orbit', subtitle: 'Weapon Event Signal',
    description: 'Chart a course toward one of two featured 5★ instruments.',
    featuredIds: ['astral-codex', 'moonspun-edge', 'tidemark-bow', 'emberglass', 'northwind-blade'],
    poolIds: ['astral-codex', 'moonspun-edge', 'verdant-oath', 'tidemark-bow', 'emberglass', 'northwind-blade', 'violet-interval', 'wayfarer-pike', 'iron-comet', 'blue-hour', 'field-notes'],
    hardPity: 80, baseRate: 0.007,
  },
  {
    id: 'standard', name: 'Wanderer’s Almanac', subtitle: 'Standard Signal',
    description: 'A permanent mixed archive of original characters and instruments.',
    featuredIds: [],
    poolIds: ['vesper', 'mirelle', 'rowan', 'isel', 'tavia', 'verdant-oath', 'cael', 'nyra', 'orren', 'tidemark-bow', 'emberglass', 'northwind-blade', 'violet-interval', 'wayfarer-pike', 'iron-comet', 'blue-hour', 'field-notes'],
    hardPity: 90, baseRate: 0.006,
  },
]

export function getItem(itemId: string): CatalogItem {
  const item = catalog.find((entry) => entry.id === itemId)
  if (!item) throw new Error(`Unknown catalog item: ${itemId}`)
  return item
}

export function getBanner(type: BannerType): BannerDefinition {
  const banner = banners.find((entry) => entry.id === type)
  if (!banner) throw new Error(`Unknown banner: ${type}`)
  return banner
}
