import { catalog, type BannerType, type ItemType } from './bannerCatalog'
import { initialBannerState, type BannerState, type Rarity } from './wishMath'

export interface HistoryItem {
  id: string
  number: number
  banner: BannerType
  itemId: string
  itemName: string
  itemType: ItemType
  rarity: Rarity
  featured: boolean
  pity: number
  ownershipCount: number
}

export interface InventoryEntry {
  itemId: string
  count: number
}

export interface StoredData {
  version: 2
  states: Record<BannerType, BannerState>
  history: HistoryItem[]
  inventory: InventoryEntry[]
  total: number
  fiveStarCount: number
  fiveStarPityTotal: number
}

export const STORAGE_KEY = 'astral-wish-lab:v2'
const LEGACY_KEY = 'astral-wish-lab:v1'

export const initialStoredData: StoredData = {
  version: 2,
  states: { character: { ...initialBannerState }, weapon: { ...initialBannerState, pathItemId: 'astral-codex' }, standard: { ...initialBannerState } },
  history: [], inventory: [], total: 0, fiveStarCount: 0, fiveStarPityTotal: 0,
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const integer = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null

function stateFrom(value: unknown, type: BannerType): BannerState {
  const hard = type === 'weapon' ? 79 : 89
  if (!isRecord(value)) return { ...initialStoredData.states[type] }
  const featuredWeaponIds = new Set(['astral-codex', 'moonspun-edge'])
  const path = typeof value.pathItemId === 'string' && featuredWeaponIds.has(value.pathItemId) ? value.pathItemId : initialStoredData.states[type].pathItemId
  return {
    pity5: integer(value.pity5, 0, hard) ?? 0,
    pity4: integer(value.pity4, 0, 9) ?? 0,
    guaranteed5: typeof value.guaranteed5 === 'boolean' ? value.guaranteed5 : false,
    guaranteed4: typeof value.guaranteed4 === 'boolean' ? value.guaranteed4 : false,
    fatePoint: type === 'weapon' ? integer(value.fatePoint, 0, 1) ?? 0 : 0,
    pathItemId: type === 'weapon' ? path : null,
  }
}

function normalizeHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry): HistoryItem[] => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.itemId !== 'string') return []
    const item = catalog.find((candidate) => candidate.id === entry.itemId)
    const banner = entry.banner === 'weapon' || entry.banner === 'standard' ? entry.banner : 'character'
    const number = integer(entry.number, 1, Number.MAX_SAFE_INTEGER), pity = integer(entry.pity, 0, 90)
    if (!item || number === null || pity === null || typeof entry.featured !== 'boolean') return []
    return [{ id: entry.id, number, banner, itemId: item.id, itemName: item.name, itemType: item.type, rarity: item.rarity, featured: entry.featured, pity, ownershipCount: integer(entry.ownershipCount, 1, Number.MAX_SAFE_INTEGER) ?? 1 }]
  }).slice(0, 300)
}

export function normalizeStoredData(value: unknown): StoredData {
  if (!isRecord(value) || value.version !== 2 || !isRecord(value.states)) return initialStoredData
  const history = normalizeHistory(value.history)
  const inventoryEntries = Array.isArray(value.inventory) ? value.inventory.flatMap((entry): InventoryEntry[] => {
    if (!isRecord(entry) || typeof entry.itemId !== 'string' || !catalog.some((item) => item.id === entry.itemId)) return []
    const count = integer(entry.count, 1, Number.MAX_SAFE_INTEGER)
    return count === null ? [] : [{ itemId: entry.itemId, count }]
  }) : []
  const inventory = [...inventoryEntries.reduce((entries, entry) => {
    entries.set(entry.itemId, (entries.get(entry.itemId) ?? 0) + entry.count)
    return entries
  }, new Map<string, number>())].map(([itemId, count]) => ({ itemId, count }))
  const retainedFiveStars = history.filter((entry) => entry.rarity === 5)
  return {
    version: 2,
    states: { character: stateFrom(value.states.character, 'character'), weapon: stateFrom(value.states.weapon, 'weapon'), standard: stateFrom(value.states.standard, 'standard') },
    history, inventory,
    total: Math.max(integer(value.total, 0, Number.MAX_SAFE_INTEGER) ?? 0, history.length),
    fiveStarCount: Math.max(integer(value.fiveStarCount, 0, Number.MAX_SAFE_INTEGER) ?? 0, retainedFiveStars.length),
    fiveStarPityTotal: Math.max(integer(value.fiveStarPityTotal, 0, Number.MAX_SAFE_INTEGER) ?? 0, retainedFiveStars.reduce((sum, entry) => sum + entry.pity, 0)),
  }
}

function migrateLegacy(value: unknown): StoredData {
  if (!isRecord(value) || !isRecord(value.state)) return initialStoredData
  const pity5 = integer(value.state.pity5, 0, 89) ?? 0, pity4 = integer(value.state.pity4, 0, 9) ?? 0
  return {
    ...initialStoredData,
    states: { ...initialStoredData.states, character: { ...initialBannerState, pity5, pity4, guaranteed5: value.state.guaranteed === true } },
    total: integer(value.total, 0, Number.MAX_SAFE_INTEGER) ?? 0,
    fiveStarCount: integer(value.fiveStarCount, 0, Number.MAX_SAFE_INTEGER) ?? 0,
    fiveStarPityTotal: integer(value.fiveStarPityTotal, 0, Number.MAX_SAFE_INTEGER) ?? 0,
  }
}

export function readStoredData(storage: Pick<Storage, 'getItem'> = localStorage): StoredData {
  try {
    const current = storage.getItem(STORAGE_KEY)
    if (current) return normalizeStoredData(JSON.parse(current))
    const legacy = storage.getItem(LEGACY_KEY)
    return legacy ? migrateLegacy(JSON.parse(legacy)) : initialStoredData
  } catch (error) {
    console.warn('Could not read saved wish data.', error)
    return initialStoredData
  }
}

export function writeStoredData(data: StoredData, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(data)); return true }
  catch (error) { console.warn('Could not save wish data.', error); return false }
}
