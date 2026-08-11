import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock3, MessageSquareText, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useCollection } from '../hooks/useCollection'
import { fetchFundQuote, fetchQuotes } from '../lib/fundApi'
import { formatDateTime, makeId, money } from '../lib/format'
import { applyBuy, matchFund, parseBuyInput } from '../lib/fundChat'
import { supabase } from '../lib/supabase'
import type { FundPosition, FundQuote } from '../types'

type FundDraft = { code: string; shares: string; cost: string; groupName: string }

const emptyDraft: FundDraft = { code: '', shares: '', cost: '', groupName: '我的持仓' }

const round4 = (value: number) => Math.round(value * 1e4) / 1e4
const round6 = (value: number) => Math.round(value * 1e6) / 1e6

type ChatMessage = { type: 'ok' | 'err'; text: string }

export function FundsPage({ user }: { user: User | null }) {
  const positions = useCollection('funds', user)
  const [quotes, setQuotes] = useState<Record<string, FundQuote | null>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<FundDraft>(emptyDraft)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [chatText, setChatText] = useState('')
  const [chatMsg, setChatMsg] = useState<ChatMessage | null>(null)
  const [chatBusy, setChatBusy] = useState(false)

  const handleChatSubmit = async () => {
    setChatMsg(null)
    const input = chatText.trim()
    if (!input) return
    const parsed = parseBuyInput(input)
    if ('error' in parsed) { setChatMsg({ type: 'err', text: parsed.error }); return }
    if (!positions.items.length) { setChatMsg({ type: 'err', text: '还没有持仓。请先在上方「添加基金」录入持仓,才能对话记账。' }); return }
    const matched = matchFund(parsed.fundText, positions.items)
    if (!matched) {
      const list = positions.items.map((item) => `· ${item.name}(${item.code})`).join('\n')
      setChatMsg({ type: 'err', text: `没有找到匹配的基金「${parsed.fundText}」。\n当前持仓:\n${list}\n\n例如:买入 500 中证500 / 买 50 黄金 / 买了100 2611` })
      return
    }
    const position = positions.items.find((item) => item.code === matched.code)
    if (!position) return
    setChatBusy(true)
    try {
      const quote = await fetchFundQuote(matched.code)
      const nav = quote.nav
      if (!(nav > 0)) { setChatMsg({ type: 'err', text: '暂时拿不到该基金最新正式净值,请稍后再试。' }); return }
      const { newShares, totalShares, newCost } = applyBuy(position, parsed.amount, nav)
      positions.setItems((current) => current.map((item) => item.code === matched.code
        ? { ...item, shares: round4(totalShares), cost: round6(newCost) }
        : item))
      if (supabase) {
        await supabase.from('fund_trades').insert({
          fund_code: matched.code,
          fund_name: matched.name,
          trade_type: 'buy',
          amount: parsed.amount,
          nav,
          shares: round4(newShares),
          fee: 0,
          trade_date: parsed.tradeDate,
          note: '工作台对话记账',
        })
      }
      setChatText('')
      setChatMsg({ type: 'ok', text: `已记录:${parsed.tradeDate} 买入 ${matched.name} ${parsed.amount} 元\n净值 ${nav.toFixed(4)} · 新增份额 ${round4(newShares)}\n最新份额 ${round4(totalShares)} · 新成本净值 ${round6(newCost)}` })
    } catch (error) {
      setChatMsg({ type: 'err', text: error instanceof Error ? error.message : '记账失败,请稍后再试。' })
    } finally {
      setChatBusy(false)
    }
  }

  const refresh = async () => {
    if (!positions.items.length) return
    setRefreshing(true)
    const next = await fetchQuotes(positions.items.map((item) => item.code))
    setQuotes(next)
    localStorage.setItem('growth-ledger-v2:fund-quotes-official', JSON.stringify(next))
    setRefreshing(false)
  }

  useEffect(() => {
    const cached = localStorage.getItem('growth-ledger-v2:fund-quotes-official')
    if (cached) {
      try { setQuotes(JSON.parse(cached) as Record<string, FundQuote | null>) } catch { /* ignore invalid cache */ }
    }
  }, [])

  useEffect(() => {
    if (!positions.loading && positions.items.length) void refresh()
  }, [positions.loading, positions.items.map((item) => item.code).join(',')])

  const totals = useMemo(() => positions.items.reduce((sum, position) => {
    const quote = quotes[position.code]
    const price = quote?.nav || position.cost
    const market = price * position.shares
    const cost = position.cost * position.shares
    return { market: sum.market + market, cost: sum.cost + cost }
  }, { market: 0, cost: 0 }), [positions.items, quotes])
  const totalProfit = totals.market - totals.cost

  const savePosition = async () => {
    setFormError('')
    const code = draft.code.trim()
    const shares = Number(draft.shares)
    const cost = Number(draft.cost)
    if (!/^\d{6}$/.test(code)) return setFormError('基金代码应为 6 位数字。')
    if (!(shares > 0) || !(cost > 0)) return setFormError('请填写大于 0 的持有份额和成本净值。')
    if (positions.items.some((item) => item.code === code)) return setFormError('这只基金已经在持仓中。')
    setSaving(true)
    try {
      const quote = await fetchFundQuote(code)
      const item: FundPosition = {
        id: makeId(), code, name: quote.name, shares, cost,
        groupName: draft.groupName.trim() || '我的持仓', createdAt: new Date().toISOString(),
      }
      positions.setItems((current) => [...current, item])
      setQuotes((current) => ({ ...current, [code]: quote }))
      setShowForm(false)
      setDraft(emptyDraft)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '无法确认基金信息。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="funds-page">
      <section className="fund-summary">
        <div className="fund-summary-main">
          <span className="eyebrow">按最新正式净值计算</span>
          <small>持仓总额</small>
          <strong>{money(totals.market)}</strong>
          <span className={totalProfit >= 0 ? 'profit-up' : 'profit-down'}>
            {totalProfit >= 0 ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
            持有收益 {money(totalProfit)}
          </span>
        </div>
        <div className="fund-summary-actions">
          <button className="button quiet" onClick={() => void refresh()} disabled={refreshing || !positions.items.length}>
            <RefreshCw size={17} className={refreshing ? 'spin' : ''} /> {refreshing ? '正在刷新' : '刷新数据'}
          </button>
          <button className="button primary" onClick={() => setShowForm(true)}><Plus size={17} /> 添加基金</button>
        </div>
      </section>

      <section className="source-notice">
        <AlertTriangle size={19} />
        <p><strong>这里显示基金公司披露后的最新单位净值,不编造盘中估算。</strong>交易日通常在收盘后更新;本页只用于持仓记录,不提供投资建议。</p>
      </section>

      <section className="panel" style={{ padding: 18 }}>
        <div className="section-heading">
          <div><span className="eyebrow">对话记账</span><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquareText size={19} /> 说一句,记一笔</h2></div>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6, margin: '0 0 12px' }}>输入买入指令,自动按当日净值折算份额、重新计算平均成本。例如:「买入 500 中证500」「买 50 黄金」「买了100 2611」</p>
        <div style={{ display: 'flex', gap: 9 }}>
          <input
            style={{ flex: 1, minWidth: 0, border: '1px solid #cbd5e3', borderRadius: 12, background: '#fbfcfe', color: 'var(--ink)', padding: '11px 12px', outline: 0, fontSize: 14 }}
            value={chatText}
            onChange={(event) => setChatText(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') void handleChatSubmit() }}
            placeholder="例如:买入 500 中证500"
            disabled={chatBusy}
          />
          <button className="button primary" onClick={() => void handleChatSubmit()} disabled={chatBusy}>{chatBusy ? '记账中…' : '记账'}</button>
        </div>
        {chatMsg && <p className={chatMsg.type === 'ok' ? 'form-message' : 'form-message error'} style={{ marginTop: 12, whiteSpace: 'pre-line' }}>{chatMsg.text}</p>}
      </section>

      <section className="positions-section panel">
        <div className="section-heading">
          <div><span className="eyebrow">我的持仓</span><h2>{positions.items.length} 只基金</h2></div>
          <span className="verified-source"><ShieldCheck size={16} /> 显示来源与时间</span>
        </div>
        {positions.items.length ? (
          <div className="position-list">
            {positions.items.map((position) => {
              const quote = quotes[position.code]
              const currentNav = quote?.nav || position.cost
              const market = currentNav * position.shares
              const profit = (currentNav - position.cost) * position.shares
              const returnPercent = position.cost ? ((currentNav - position.cost) / position.cost) * 100 : 0
              return (
                <article className="position-card" key={position.id}>
                  <div className="position-head">
                    <div className="fund-identity"><span className="fund-code">{position.code}</span><span><strong>{quote?.name || position.name}</strong><small>{position.groupName}</small></span></div>
                    <button className="icon-button danger-icon" aria-label={`删除${position.name}`} onClick={() => { if (window.confirm('确认移除这只基金？')) positions.remove(position.id) }}><Trash2 size={17} /></button>
                  </div>
                  <div className="position-numbers">
                    <div><small>估算市值</small><strong>{money(market)}</strong></div>
                    <div><small>持有收益</small><strong className={profit >= 0 ? 'profit-up' : 'profit-down'}>{money(profit)}</strong></div>
                    <div><small>收益率</small><strong className={returnPercent >= 0 ? 'profit-up' : 'profit-down'}>{returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%</strong></div>
                  </div>
                  <div className="quote-line">
                    {quote ? (
                      <>
                        <span>最新净值 {quote.nav.toFixed(4)} · 净值日期 {quote.valueDate}</span>
                        <span className={quote.changePercent >= 0 ? 'profit-up' : 'profit-down'}>{quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</span>
                      </>
                    ) : <span className="data-missing">当前未取得行情，暂按成本显示</span>}
                  </div>
                  <div className="quote-source"><Clock3 size={14} /> {quote ? `${quote.source} · ${formatDateTime(quote.updatedAt)}${quote.status === 'stale' ? ' · 数据可能过期' : ''}` : '等待刷新'}</div>
                </article>
              )
            })}
          </div>
        ) : (
          <button className="empty-portfolio" onClick={() => setShowForm(true)}>
            <span className="empty-chart"><i /><i /><i /></span>
            <strong>添加第一只基金</strong>
            <small>输入基金代码、持有份额和成本净值，即可计算真实持仓。</small>
          </button>
        )}
      </section>

      {showForm && (
        <Modal title="添加基金持仓" onClose={() => { setShowForm(false); setFormError('') }}>
          <div className="form-stack">
            <label>基金代码<input inputMode="numeric" maxLength={6} value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.replace(/\D/g, '') })} placeholder="例如 110022" /></label>
            <div className="form-split">
              <label>持有份额<input inputMode="decimal" value={draft.shares} onChange={(event) => setDraft({ ...draft, shares: event.target.value })} placeholder="0.00" /></label>
              <label>成本净值<input inputMode="decimal" value={draft.cost} onChange={(event) => setDraft({ ...draft, cost: event.target.value })} placeholder="0.0000" /></label>
            </div>
            <label>分组<input value={draft.groupName} onChange={(event) => setDraft({ ...draft, groupName: event.target.value })} /></label>
            {formError && <p className="form-message error">{formError}</p>}
            <button className="button primary full" onClick={() => void savePosition()} disabled={saving}>{saving ? '正在核对基金…' : '核对并保存'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
