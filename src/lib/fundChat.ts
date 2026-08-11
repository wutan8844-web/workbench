// 基金对话记账:自然语言买入解析 + 持仓匹配
// 规则移植自飞书遥控助手 record_fund_purchase(已在 Excel 账本上验证过)

export type ParsedBuy =
  | { amount: number; fundText: string; tradeDate: string }
  | { error: string }

const COMPANY_PREFIXES =
  '易方达|华夏|博时|南方|广发|天弘|嘉实|汇添富|招商|富国|中欧|景顺|工银|华安|国泰|鹏华|兴全|交银|银华|建信|平安|华宝|申万|大成|诺安|海富通|融通|万家|长盛|信诚|新华|东吴|方正|浙商|财通|光大|中银|民生|安信|中泰|长城|圆信|英大|太平|国联安|中海|天治|金鹰|泰达|中加|永赢|先锋|西藏东财'

const toDateStr = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addDays = (d: Date, n: number) => {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

// 解析买入日期:默认今天;支持 昨天/前天/8月9日/8-9/2026-08-09 等
export function parseBuyDate(text: string, now = new Date()): string {
  if (/昨天/.test(text)) return toDateStr(addDays(now, -1))
  if (/前天/.test(text)) return toDateStr(addDays(now, -2))
  const full = /(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?/.exec(text)
  if (full) return toDateStr(new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3])))
  const short = /(\d{1,2})月(\d{1,2})日?/.exec(text)
  if (short) return toDateStr(new Date(now.getFullYear(), Number(short[1]) - 1, Number(short[2])))
  return toDateStr(now)
}

export function parseBuyInput(text: string): ParsedBuy {
  const clean = text.trim()

  // 1) 提取金额:优先 块/元/块钱,其次 买了/买入/花了/投入,兜底末尾数字
  let amount: number | null = null
  let span: [number, number] | null = null

  let m = /(\d+(?:\.\d+)?)\s*(?:块|元|块钱)/.exec(clean)
  if (m) {
    amount = parseFloat(m[1])
    span = [m.index, m.index + m[0].length]
  }
  if (amount == null) {
    for (const pat of ['买了\\s*(\\d+(?:\\.\\d+)?)', '买入\\s*(\\d+(?:\\.\\d+)?)', '花了\\s*(\\d+(?:\\.\\d+)?)', '投入\\s*(\\d+(?:\\.\\d+)?)', '买\\s*(\\d+(?:\\.\\d+)?)']) {
      const mm = new RegExp(pat).exec(clean)
      if (mm) {
        amount = parseFloat(mm[1])
        span = [mm.index, mm.index + mm[0].length]
        break
      }
    }
  }
  if (amount == null) {
    const tail = /(\d+(?:\.\d+)?)\s*$/.exec(clean)
    if (tail) {
      amount = parseFloat(tail[1])
      span = [tail.index, tail.index + tail[0].length]
    }
  }
  if (amount == null || amount <= 0) {
    return { error: '没有识别到金额。例如:买入 500 中证500' }
  }

  // 2) 提取基金文本:删掉金额部分、日期词与干扰词
  const tradeDate = parseBuyDate(clean)
  let fundText = clean
  if (span) {
    let [s, e] = span
    while (e < fundText.length && '块元钱 '.includes(fundText[e])) e += 1
    while (s > 0 && fundText[s - 1] === ' ') s -= 1
    fundText = fundText.slice(0, s) + fundText.slice(e)
  }
  fundText = fundText.replace(/(?:昨天|前天|今天|昨天早上|昨天下午|刚才|这会儿|这会)+/g, '')
  fundText = fundText.replace(/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?/g, '')
  fundText = fundText.replace(/\d{1,2}月\d{1,2}日?/g, '')
  fundText = fundText.replace(/(?:我|刚才|上午|下午)+/g, '')
  fundText = fundText.replace(/(?:买了|买入|买基金|买)\s*/g, '')
  fundText = fundText.replace(/(?:了|的|约|大概|差不多|共|一共|投入|花了|一份)/g, '')
  fundText = fundText.replace(/\s+/g, ' ').trim()

  if (!fundText) {
    const codes = /\b(\d{4,6})\b/.exec(clean)
    if (codes) fundText = codes[1]
  }
  if (!fundText) {
    return { error: '没有识别到基金。例如:买入 500 中证500' }
  }
  return { amount, fundText, tradeDate }
}

type Matchable = { code: string; name: string; groupName: string }

export function matchFund(
  fundText: string,
  positions: Matchable[],
): { code: string; name: string } | null {
  const lower = fundText.toLowerCase()
  const code = /^(\d{4,6})$/.exec(fundText)?.[1]

  for (const p of positions) {
    if (code && (p.code === code || p.code === code.padStart(6, '0'))) return { code: p.code, name: p.name }
    const pName = p.name.toLowerCase()
    if (pName.includes(lower) || lower.includes(pName)) return { code: p.code, name: p.name }
    if (p.groupName.toLowerCase().includes(lower)) return { code: p.code, name: p.name }
  }

  const short = fundText.replace(new RegExp(`^(?:${COMPANY_PREFIXES})`, 'i'), '')
  if (short.length >= 2) {
    for (const p of positions) {
      if (p.name.toLowerCase().includes(short.toLowerCase())) return { code: p.code, name: p.name }
    }
  }
  return null
}

// 平均成本法:买入金额 amount、最新净值 nav
// 新增份额 = amount / nav;新成本净值 = (旧份额×旧成本 + amount) / 新份额
export function applyBuy(
  position: { shares: number; cost: number },
  amount: number,
  nav: number,
) {
  const newShares = amount / nav
  const totalShares = position.shares + newShares
  const newCost = totalShares > 0 ? (position.shares * position.cost + amount) / totalShares : 0
  return {
    newShares,
    totalShares,
    newCost,
  }
}
