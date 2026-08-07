import type { Rarity, WishState } from './wishMath'

export interface HistoryItem {
  id: string
  number: number
  rarity: Rarity
  featured: boolean
  pity: number
}

export interface StoredData {
  state: WishState
  history: HistoryItem[]
  total: number
  fiveStarCount: number
  fiveStarPityTotal: number
}

export const STORAGE_KEY = 'astral-wish-lab:v1'
export const initialState: WishState = { pity5: 0, pity4: 0, guaranteed: false }
export const initialStoredData: StoredData = {
  state: initialState,
  history: [],
  total: 0,
  fiveStarCount: 0,
  fiveStarPityTotal: 0,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function integerInRange(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null
}

function normalizeHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item): HistoryItem[] => {
    if (!isRecord(item)) return []
    const rarity = integerInRange(item.rarity, 3, 5)
    const number = integerInRange(item.number, 1, Number.MAX_SAFE_INTEGER)
    const pity = integerInRange(item.pity, 0, 90)
    if (rarity === null || number === null || pity === null || typeof item.id !== 'string' || typeof item.featured !== 'boolean') return []
    return [{ id: item.id, number, pity, rarity: rarity as Rarity, featured: item.featured }]
  }).slice(0, 120)
}

export function normalizeStoredData(value: unknown): StoredData {
  if (!isRecord(value) || !isRecord(value.state)) return initialStoredData

  const pity5 = integerInRange(value.state.pity5, 0, 89)
  const pity4 = integerInRange(value.state.pity4, 0, 9)
  if (pity5 === null || pity4 === null || typeof value.state.guaranteed !== 'boolean') return initialStoredData

  const history = normalizeHistory(value.history)
  const total = integerInRange(value.total, 0, Number.MAX_SAFE_INTEGER) ?? 0
  const retainedFiveStars = history.filter((item) => item.rarity === 5)
  const retainedPityTotal = retainedFiveStars.reduce((sum, item) => sum + item.pity, 0)
  const fiveStarCount = integerInRange(value.fiveStarCount, 0, Number.MAX_SAFE_INTEGER) ?? retainedFiveStars.length
  const fiveStarPityTotal = integerInRange(value.fiveStarPityTotal, 0, Number.MAX_SAFE_INTEGER) ?? retainedPityTotal

  return {
    state: { pity5, pity4, guaranteed: value.state.guaranteed },
    history,
    total: Math.max(total, history.length),
    fiveStarCount: Math.max(fiveStarCount, retainedFiveStars.length),
    fiveStarPityTotal: Math.max(fiveStarPityTotal, retainedPityTotal),
  }
}

export function readStoredData(storage: Pick<Storage, 'getItem'> = localStorage): StoredData {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw ? normalizeStoredData(JSON.parse(raw)) : initialStoredData
  } catch (error) {
    console.warn('Could not read saved wish data.', error)
    return initialStoredData
  }
}

export function writeStoredData(data: StoredData, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.warn('Could not save wish data.', error)
    return false
  }
}
