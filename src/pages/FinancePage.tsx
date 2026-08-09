import { useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowDown, ArrowLeftRight, ArrowUp, CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useCollection } from '../hooks/useCollection'
import { localDateKey, makeId, money, monthKey, today } from '../lib/format'
import type { Transaction, TransactionType } from '../types'

const categories: Record<TransactionType, string[]> = {
  expense: ['餐饮', '交通', '购物', '住房', '学习', '医疗', '娱乐', '其他支出'],
  income: ['工资', '奖金', '报销', '理财', '其他收入'],
  transfer: ['账户互转', '还款', '其他转账'],
}

type Draft = { type: TransactionType; amount: string; category: string; note: string; date: string }
const newDraft = (): Draft => ({ type: 'expense', amount: '', category: '餐饮', note: '', date: today() })

export function FinancePage({ user }: { user: User | null }) {
  const records = useCollection('transactions', user)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(newDraft)
  const [error, setError] = useState('')
  const month = monthKey()
  const monthRecords = useMemo(() => records.items.filter((item) => item.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [records.items, month])
  const income = monthRecords.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expense = monthRecords.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>()
    monthRecords.filter((item) => item.type === 'expense').forEach((item) => map.set(item.category, (map.get(item.category) || 0) + item.amount))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [monthRecords])

  const lastSeven = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = localDateKey(date)
    return {
      key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      amount: records.items.filter((item) => item.date === key && item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
    }
  }), [records.items])
  const chartMax = Math.max(...lastSeven.map((item) => item.amount), 1)

  const openCreate = () => {
    setEditingId(null)
    setDraft(newDraft())
    setError('')
    setShowForm(true)
  }

  const openEdit = (item: Transaction) => {
    setEditingId(item.id)
    setDraft({ type: item.type, amount: String(item.amount), category: item.category, note: item.note, date: item.date })
    setError('')
    setShowForm(true)
  }

  const changeType = (type: TransactionType) => {
    setDraft((current) => ({ ...current, type, category: categories[type][0] }))
  }

  const save = () => {
    const amount = Number(draft.amount)
    if (!(amount > 0)) return setError('金额必须大于 0。')
    if (!draft.date) return setError('请选择日期。')
    const previous = records.items.find((item) => item.id === editingId)
    const item: Transaction = {
      id: editingId || makeId(), type: draft.type, amount, category: draft.category,
      note: draft.note.trim(), date: draft.date, createdAt: previous?.createdAt || new Date().toISOString(),
    }
    records.setItems((current) => editingId ? current.map((entry) => entry.id === editingId ? item : entry) : [item, ...current])
    setShowForm(false)
  }

  return (
    <div className="finance-page">
      <section className="finance-hero">
        <div className="finance-month"><CalendarDays size={18} /><span>{Number(month.slice(5))} 月账本</span></div>
        <div className="balance-figure"><small>本月结余</small><strong className={income - expense < 0 ? 'negative' : ''}>{money(income - expense)}</strong></div>
        <div className="cash-flow-row">
          <div><span className="flow-icon income"><ArrowDown size={16} /></span><span><small>收入</small><strong>{money(income)}</strong></span></div>
          <div><span className="flow-icon expense"><ArrowUp size={16} /></span><span><small>支出</small><strong>{money(expense)}</strong></span></div>
        </div>
        <button className="button primary finance-add" onClick={openCreate}><Plus size={18} /> 记一笔</button>
      </section>

      <div className="finance-grid">
        <section className="panel spending-chart">
          <div className="section-heading compact"><div><span className="eyebrow">最近七天</span><h2>每天花了多少</h2></div></div>
          <div className="bar-chart" aria-label="最近七天支出图">
            {lastSeven.map((item) => (
              <div className="bar-column" key={item.key} title={`${item.label} ${money(item.amount)}`}>
                <span className="bar-value">{item.amount ? Math.round(item.amount) : ''}</span>
                <i style={{ height: `${Math.max((item.amount / chartMax) * 100, item.amount ? 5 : 1)}%` }} />
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel category-panel">
          <div className="section-heading compact"><div><span className="eyebrow">本月分类</span><h2>钱主要花在哪</h2></div></div>
          {expenseByCategory.length ? (
            <div className="category-bars">
              {expenseByCategory.slice(0, 6).map(([category, amount]) => (
                <div className="category-row" key={category}>
                  <div><span>{category}</span><strong>{money(amount)}</strong></div>
                  <i><b style={{ width: `${expense ? (amount / expense) * 100 : 0}%` }} /></i>
                </div>
              ))}
            </div>
          ) : <p className="empty-copy">记下第一笔支出后，这里会显示分类占比。</p>}
        </section>
      </div>

      <section className="panel records-panel">
        <div className="section-heading"><div><span className="eyebrow">账目明细</span><h2>{monthRecords.length} 条记录</h2></div><button className="button quiet small" onClick={openCreate}><Plus size={16} /> 添加</button></div>
        {monthRecords.length ? (
          <div className="record-list">
            {monthRecords.map((item) => (
              <article className="record-row" key={item.id}>
                <span className={`record-type ${item.type}`}>{item.type === 'expense' ? <ArrowUp size={17} /> : item.type === 'income' ? <ArrowDown size={17} /> : <ArrowLeftRight size={17} />}</span>
                <span className="record-copy"><strong>{item.category}</strong><small>{item.date.slice(5).replace('-', '月')}日{item.note ? ` · ${item.note}` : ''}</small></span>
                <strong className={`record-amount ${item.type}`}>{item.type === 'expense' ? '-' : item.type === 'income' ? '+' : ''}{money(item.amount)}</strong>
                <button className="icon-button" aria-label="编辑记录" onClick={() => openEdit(item)}><Pencil size={16} /></button>
                <button className="icon-button danger-icon" aria-label="删除记录" onClick={() => { if (window.confirm('删除这条记录？')) records.remove(item.id) }}><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        ) : <button className="empty-invite" onClick={openCreate}><Plus size={18} /><span><strong>记下本月第一笔收支</strong><small>手动记录最稳妥，也不需要提供银行卡密码。</small></span></button>}
      </section>

      {showForm && (
        <Modal title={editingId ? '编辑记录' : '记一笔'} onClose={() => setShowForm(false)}>
          <div className="form-stack">
            <div className="type-switch">
              {(['expense', 'income', 'transfer'] as TransactionType[]).map((type) => (
                <button key={type} className={draft.type === type ? 'active' : ''} onClick={() => changeType(type)}>{type === 'expense' ? '支出' : type === 'income' ? '收入' : '转账'}</button>
              ))}
            </div>
            <label>金额<input className="amount-input" inputMode="decimal" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="0.00" /></label>
            <label>分类<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories[draft.type].map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>日期<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
            <label>备注<input value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="选填，例如：午餐" /></label>
            {error && <p className="form-message error">{error}</p>}
            <button className="button primary full" onClick={save}>保存记录</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
