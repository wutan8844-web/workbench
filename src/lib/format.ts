export const localDateKey = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export const today = () => localDateKey(new Date())

export const monthKey = () => today().slice(0, 7)

export const money = (value: number) => new Intl.NumberFormat('zh-CN', {
  style: 'currency', currency: 'CNY', minimumFractionDigits: 2,
}).format(Number.isFinite(value) ? value : 0)

export const shortMoney = (value: number) => new Intl.NumberFormat('zh-CN', {
  notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
  maximumFractionDigits: 1,
}).format(Number.isFinite(value) ? value : 0)

export const formatDateTime = (value: string) => {
  if (!value) return '时间未知'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

export const makeId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
