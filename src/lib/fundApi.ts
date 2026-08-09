import type { FundQuote } from '../types'
import { supabase } from './supabase'

type FundSearchResponse = {
  ErrCode: number
  Datas?: Array<{ CODE: string; NAME: string }>
}

type FundHistoryResponse = {
  ErrCode: number
  Data?: {
    LSJZList?: Array<{ FSRQ: string; DWJZ: string; JZZZL: string }>
  }
}

function loadJsonp<T>(url: string) {
  return new Promise<T>((resolve, reject) => {
    const callback = `growthLedgerFund_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('基金数据请求超时，请稍后重试。'))
    }, 10000)
    const globalWindow = window as unknown as Record<string, unknown>
    const cleanup = () => {
      window.clearTimeout(timer)
      script.remove()
      delete globalWindow[callback]
    }
    globalWindow[callback] = (data: T) => {
      cleanup()
      resolve(data)
    }
    script.onerror = () => {
      cleanup()
      reject(new Error('暂时无法连接基金数据源。'))
    }
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callback}`
    document.head.appendChild(script)
  })
}

function isStale(valueDate: string) {
  const value = new Date(`${valueDate}T15:00:00+08:00`).getTime()
  return !Number.isFinite(value) || Date.now() - value > 7 * 86400000
}

async function directOfficialNav(code: string): Promise<FundQuote> {
  const [search, history] = await Promise.all([
    loadJsonp<FundSearchResponse>(`https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(code)}`),
    loadJsonp<FundHistoryResponse>(`https://api.fund.eastmoney.com/f10/lsjz?fundCode=${encodeURIComponent(code)}&pageIndex=1&pageSize=1&startDate=&endDate=`),
  ])
  const fund = search.Datas?.find((item) => item.CODE === code)
  const latest = history.Data?.LSJZList?.[0]
  if (search.ErrCode !== 0 || history.ErrCode !== 0 || !fund || !latest || !(Number(latest.DWJZ) > 0)) {
    throw new Error('没有找到这个基金代码，或最新净值尚未公布。')
  }
  return {
    code,
    name: fund.NAME,
    nav: Number(latest.DWJZ),
    changePercent: Number(latest.JZZZL || 0),
    valueDate: latest.FSRQ,
    updatedAt: `${latest.FSRQ}T15:00:00+08:00`,
    source: '天天基金最新正式净值',
    status: isStale(latest.FSRQ) ? 'stale' : 'fresh',
  }
}

export async function fetchFundQuote(code: string): Promise<FundQuote> {
  if (!/^\d{6}$/.test(code)) throw new Error('基金代码应为 6 位数字。')
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('market-data', { body: { code } })
    if (!error && data?.quote) return data.quote as FundQuote
  }
  return directOfficialNav(code)
}

export async function fetchQuotes(codes: string[]) {
  const pairs = await Promise.all(codes.map(async (code) => {
    try {
      return [code, await fetchFundQuote(code)] as const
    } catch {
      return [code, null] as const
    }
  }))
  return Object.fromEntries(pairs) as Record<string, FundQuote | null>
}
