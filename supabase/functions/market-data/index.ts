const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type SearchResponse = {
  ErrCode: number
  Datas?: Array<{ CODE: string; NAME: string }>
}

type HistoryResponse = {
  ErrCode: number
  Data?: { LSJZList?: Array<{ FSRQ: string; DWJZ: string; JZZZL: string }> }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { code } = await request.json() as { code?: string }
    if (!code || !/^\d{6}$/.test(code)) {
      return Response.json({ error: '基金代码应为 6 位数字。' }, { status: 400, headers: corsHeaders })
    }

    const headers = { 'Referer': 'https://fund.eastmoney.com/', 'User-Agent': 'GrowthLedger/2.0' }
    const [searchResponse, historyResponse] = await Promise.all([
      fetch(`https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${code}`, { headers }),
      fetch(`https://api.fund.eastmoney.com/f10/lsjz?fundCode=${code}&pageIndex=1&pageSize=1&startDate=&endDate=`, { headers }),
    ])
    if (!searchResponse.ok || !historyResponse.ok) throw new Error('fund data upstream failed')
    const search = await searchResponse.json() as SearchResponse
    const history = await historyResponse.json() as HistoryResponse
    const fund = search.Datas?.find((item) => item.CODE === code)
    const latest = history.Data?.LSJZList?.[0]
    if (!fund || !latest || !(Number(latest.DWJZ) > 0)) {
      return Response.json({ error: '未找到该基金或最新净值。' }, { status: 404, headers: corsHeaders })
    }
    const valueTime = new Date(`${latest.FSRQ}T15:00:00+08:00`).getTime()
    const quote = {
      code,
      name: fund.NAME,
      nav: Number(latest.DWJZ),
      changePercent: Number(latest.JZZZL || 0),
      valueDate: latest.FSRQ,
      updatedAt: `${latest.FSRQ}T15:00:00+08:00`,
      source: '天天基金最新正式净值',
      status: !Number.isFinite(valueTime) || Date.now() - valueTime > 7 * 86400000 ? 'stale' : 'fresh',
    }
    return Response.json({ quote }, {
      headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '净值请求失败。' }, { status: 502, headers: corsHeaders })
  }
})
