const PREFIX = 'growth-ledger-v2:'
const SYNC_PREFIX = `${PREFIX}sync:`

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`${PREFIX}${key}`)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
}

export function isSyncPending(key: string) {
  return localStorage.getItem(`${SYNC_PREFIX}${key}`) === 'pending'
}

export function setSyncPending(key: string, pending: boolean) {
  const storageKey = `${SYNC_PREFIX}${key}`
  if (pending) localStorage.setItem(storageKey, 'pending')
  else localStorage.removeItem(storageKey)
}

export function readTombstones(key: string) {
  return readLocal<string[]>(`deleted:${key}`, [])
}

export function addTombstone(key: string, id: string) {
  const current = readTombstones(key)
  if (!current.includes(id)) writeLocal(`deleted:${key}`, [...current, id])
}

export function removeTombstone(key: string, id: string) {
  writeLocal(`deleted:${key}`, readTombstones(key).filter((item) => item !== id))
}

export function localKeys() {
  return {
    transactions: `${PREFIX}transactions`,
    funds: `${PREFIX}funds`,
    progress: `${PREFIX}progress`,
    notes: `${PREFIX}notes`,
    tasks: `${PREFIX}tasks`,
    reviews: `${PREFIX}reviews`,
    english: `${PREFIX}english`,
  }
}

export function hasLegacyData() {
  return Boolean(localStorage.getItem('workbench_v1'))
}

export function downloadBackup() {
  const data: Record<string, unknown> = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(PREFIX) || key === 'workbench_v1') {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || 'null')
      } catch {
        data[key] = localStorage.getItem(key)
      }
    }
  }
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], {
    type: 'application/json',
  })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `进度本备份-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(href)
}

export async function restoreBackup(file: File) {
  const parsed = JSON.parse(await file.text()) as { data?: Record<string, unknown> }
  if (!parsed.data || typeof parsed.data !== 'object') throw new Error('这不是有效的进度本备份文件。')
  const entries = Object.entries(parsed.data).filter(([key]) => key.startsWith(PREFIX) || key === 'workbench_v1')
  if (!entries.length) throw new Error('备份中没有找到可恢复的数据。')
  entries.forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)))
  return entries.length
}
