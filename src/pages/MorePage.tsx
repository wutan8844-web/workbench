import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowUpRight, BookMarked, Brain, Check, ClipboardCheck, Cloud, DatabaseBackup, Download, Headphones, ListTodo, Newspaper, Pencil, Plus, RefreshCw, RotateCcw, Search, Settings2, Trash2, Upload } from 'lucide-react'
import { Modal } from '../components/Modal'
import { wordsForToday, speakWord } from '../data/english'
import { useCollection } from '../hooks/useCollection'
import { migrateLocalCollections } from '../lib/data'
import { fetchRealNews } from '../lib/newsApi'
import { downloadBackup, hasLegacyData, restoreBackup } from '../lib/storage'
import { formatDateTime, makeId, today } from '../lib/format'
import type { DailyReview, DailyTask, EnglishProgress, JournalNote, NewsItem } from '../types'

type MoreTab = 'tasks' | 'review' | 'memo' | 'english' | 'news' | 'settings'

export function MorePage({ user }: { user: User | null }) {
  const [tab, setTab] = useState<MoreTab>('tasks')
  const tabs = [
    { id: 'tasks' as const, label: '任务', icon: ListTodo },
    { id: 'review' as const, label: '复盘', icon: ClipboardCheck },
    { id: 'memo' as const, label: '备忘', icon: BookMarked },
    { id: 'english' as const, label: '英语', icon: Brain },
    { id: 'news' as const, label: 'AI 新闻', icon: Newspaper },
    { id: 'settings' as const, label: '数据', icon: Settings2 },
  ]
  return (
    <div className="more-page">
      <nav className="subtabs" aria-label="更多功能">
        {tabs.map((item) => {
          const Icon = item.icon
          return <button className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => setTab(item.id)}><Icon size={17} />{item.label}</button>
        })}
      </nav>
      {tab === 'tasks' && <TasksPanel user={user} />}
      {tab === 'review' && <ReviewPanel user={user} />}
      {tab === 'memo' && <MemoPanel user={user} />}
      {tab === 'english' && <EnglishPanel user={user} />}
      {tab === 'news' && <NewsPanel />}
      {tab === 'settings' && <SettingsPanel user={user} />}
    </div>
  )
}

function EnglishPanel({ user }: { user: User | null }) {
  const progress = useCollection('english', user)
  const words = useMemo(() => wordsForToday(progress.items), [progress.loading])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const word = words[index]
  const learnedToday = words.filter((item) => progress.items.some((entry) => entry.word === item.word && entry.level > 0)).length

  const mark = (known: boolean) => {
    const previous = progress.items.find((item) => item.word === word.word)
    const level = known ? Math.min((previous?.level || 0) + 1, 5) : Math.max((previous?.level || 0) - 1, 0)
    const review = new Date()
    review.setDate(review.getDate() + (known ? [1, 2, 4, 7, 14][Math.max(level - 1, 0)] : 0))
    const item: EnglishProgress = { word: word.word, level, nextReview: review.toISOString().slice(0, 10), updatedAt: new Date().toISOString() }
    progress.setItems((current) => [...current.filter((entry) => entry.word !== word.word), item])
    setRevealed(false)
    setIndex((value) => (value + 1) % words.length)
  }

  return (
    <div className="english-layout">
      <section className="panel english-intro">
        <span className="eyebrow">小学四年级起步</span>
        <h2>今天 5 个词</h2>
        <p>先听、再猜、最后看例句。认识的词会隔几天再次出现，不用一次背死。</p>
        <div className="mini-progress"><i style={{ width: `${(learnedToday / 5) * 100}%` }} /></div>
        <small>今日已认识 {learnedToday} / 5</small>
      </section>
      <section className="word-study-card">
        <div className="word-count">{index + 1} / 5</div>
        <button className="speak-button" onClick={() => speakWord(word.word)}><Headphones size={20} /> 听发音</button>
        <h2>{word.word}</h2>
        <p className="phonetic">{word.phonetic}</p>
        {revealed ? (
          <div className="word-answer">
            <strong>{word.meaning}</strong>
            <p>{word.example}</p>
            <small>{word.translation}</small>
          </div>
        ) : <button className="reveal-word" onClick={() => setRevealed(true)}>想一想，再看答案</button>}
        <div className="word-actions">
          <button className="button quiet" onClick={() => mark(false)}><RotateCcw size={17} /> 再学一次</button>
          <button className="button primary" onClick={() => mark(true)}>我认识了</button>
        </div>
      </section>
    </div>
  )
}

function NewsPanel() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try { setItems(await fetchRealNews()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '暂时无法获取新闻。') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  return (
    <section className="panel news-panel">
      <div className="section-heading">
        <div><span className="eyebrow">真实来源 · 不伪造标题</span><h2>最新 AI 动态</h2></div>
        <button className="button quiet small" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> 刷新</button>
      </div>
      <p className="news-note">当前展示公开技术社区最新收录；连接云端函数后会聚合官方博客与研究源。</p>
      {loading && <div className="loading-list">正在读取真实新闻源…</div>}
      {error && <p className="form-message error">{error}</p>}
      <div className="news-list">
        {items.map((item, index) => (
          <a href={item.url} target="_blank" rel="noreferrer" className="news-row" key={item.id}>
            <span className="news-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="news-copy"><strong>{item.title}</strong><small>{item.source} · {formatDateTime(item.publishedAt)}</small>{item.summary && <em>{item.summary}</em>}</span>
            <ArrowUpRight size={17} />
          </a>
        ))}
      </div>
    </section>
  )
}

function TasksPanel({ user }: { user: User | null }) {
  const tasks = useCollection('tasks', user)
  const [filter, setFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today())
  const [priority, setPriority] = useState<DailyTask['priority']>('medium')
  const [error, setError] = useState('')
  const sorted = [...tasks.items].sort((a, b) => b.date.localeCompare(a.date) || ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
  const visible = filter === 'all' ? sorted : sorted.filter((item) => item.status === filter)

  const openCreate = () => {
    setEditingId(null); setTitle(''); setNote(''); setDate(today()); setPriority('medium'); setError(''); setShowForm(true)
  }
  const openEdit = (task: DailyTask) => {
    setEditingId(task.id); setTitle(task.title); setNote(task.note); setDate(task.date); setPriority(task.priority); setError(''); setShowForm(true)
  }
  const save = () => {
    if (!title.trim()) return setError('任务内容不能为空。')
    const previous = tasks.items.find((item) => item.id === editingId)
    const item: DailyTask = {
      id: editingId || makeId(), title: title.trim(), note: note.trim(), date, priority,
      status: previous?.status || 'todo', createdAt: previous?.createdAt || new Date().toISOString(),
    }
    tasks.setItems((current) => editingId ? current.map((entry) => entry.id === editingId ? item : entry) : [item, ...current])
    setShowForm(false)
  }
  const cycle = (id: string) => tasks.setItems((current) => current.map((item) => item.id === id ? { ...item, status: item.status === 'todo' ? 'doing' : item.status === 'doing' ? 'done' : 'todo' } : item))

  return (
    <section className="panel full-task-panel">
      <div className="section-heading"><div><span className="eyebrow">明确下一步</span><h2>每日任务</h2></div><button className="button primary small" onClick={openCreate}><Plus size={16} /> 添加任务</button></div>
      <div className="task-filters">
        {(['all', 'todo', 'doing', 'done'] as const).map((value) => <button className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>{value === 'all' ? '全部' : value === 'todo' ? '待办' : value === 'doing' ? '进行中' : '已完成'}</button>)}
      </div>
      {visible.length ? <div className="full-task-list">
        {visible.map((task) => (
          <article className={`full-task-row ${task.status}`} key={task.id}>
            <button className="task-status-button" onClick={() => cycle(task.id)} aria-label="切换任务状态">{task.status === 'done' ? <Check size={16} /> : task.status === 'doing' ? '…' : ''}</button>
            <div className="full-task-copy"><span><i className={`priority-dot ${task.priority}`} />{task.title}</span><small>{task.date}{task.note ? ` · ${task.note}` : ''}</small></div>
            <span className={`status-label ${task.status}`}>{task.status === 'todo' ? '待办' : task.status === 'doing' ? '进行中' : '完成'}</span>
            <button className="icon-button" onClick={() => openEdit(task)}><Pencil size={15} /></button>
            <button className="icon-button danger-icon" onClick={() => { if (window.confirm('删除这条任务？')) tasks.remove(task.id) }}><Trash2 size={15} /></button>
          </article>
        ))}
      </div> : <button className="empty-invite" onClick={openCreate}><Plus size={18} /><span><strong>当前筛选下没有任务</strong><small>添加一件具体、今天可以完成的事。</small></span></button>}
      {showForm && <Modal title={editingId ? '编辑任务' : '添加任务'} onClose={() => setShowForm(false)}><div className="form-stack">
        <label>任务内容<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：完成 HTML 第 3 课" /></label>
        <label>补充说明<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="完成标准、相关人或资料" /></label>
        <div className="form-split"><label>日期<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>优先级<select value={priority} onChange={(event) => setPriority(event.target.value as DailyTask['priority'])}><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label></div>
        {error && <p className="form-message error">{error}</p>}
        <button className="button primary full" onClick={save}>保存任务</button>
      </div></Modal>}
    </section>
  )
}

function ReviewPanel({ user }: { user: User | null }) {
  const reviews = useCollection('reviews', user)
  const [date, setDate] = useState(today())
  const current = reviews.items.find((item) => item.date === date)
  const [summary, setSummary] = useState('')
  const [gain, setGain] = useState('')
  const [lack, setLack] = useState('')
  const [plan, setPlan] = useState('')
  const [mood, setMood] = useState(3)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSummary(current?.summary || ''); setGain(current?.gain || ''); setLack(current?.lack || ''); setPlan(current?.plan || ''); setMood(current?.mood || 3); setSaved(false)
  }, [date, current?.updatedAt])

  const save = () => {
    if (![summary, gain, lack, plan].some((value) => value.trim())) return
    const item: DailyReview = {
      id: current?.id || makeId(), date, summary: summary.trim(), gain: gain.trim(), lack: lack.trim(), plan: plan.trim(), mood, updatedAt: new Date().toISOString(),
    }
    reviews.setItems((items) => [...items.filter((entry) => entry.date !== date), item])
    setSaved(true)
  }
  const history = [...reviews.items].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="review-layout">
      <section className="panel review-editor">
        <div className="section-heading"><div><span className="eyebrow">每天五分钟</span><h2>每日复盘</h2></div><input className="review-date" type="date" max={today()} value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <div className="mood-row"><span>今天状态</span>{[1,2,3,4,5].map((value) => <button className={mood === value ? 'active' : ''} key={value} onClick={() => setMood(value)}>{['很累','偏低','平稳','不错','很好'][value - 1]}</button>)}</div>
        <div className="review-fields">
          <label><span>01 今天完成了什么</span><textarea value={summary} onChange={(event) => { setSummary(event.target.value); setSaved(false) }} placeholder="只写事实，不写空泛评价。" /></label>
          <label><span>02 今天有什么收获</span><textarea value={gain} onChange={(event) => { setGain(event.target.value); setSaved(false) }} placeholder="学到的知识、有效的方法、值得保留的做法。" /></label>
          <label><span>03 哪里做得不够</span><textarea value={lack} onChange={(event) => { setLack(event.target.value); setSaved(false) }} placeholder="具体卡在哪里，原因是什么？" /></label>
          <label><span>04 明天怎么改进</span><textarea value={plan} onChange={(event) => { setPlan(event.target.value); setSaved(false) }} placeholder="写成明天可以直接执行的一步。" /></label>
        </div>
        <button className="button primary full" onClick={save}>{saved ? '已保存' : '保存复盘'}</button>
      </section>
      <aside className="panel review-history"><span className="eyebrow">历史记录</span><h2>最近复盘</h2>{history.length ? <div className="review-history-list">{history.slice(0, 12).map((item) => <button className={date === item.date ? 'active' : ''} key={item.id} onClick={() => setDate(item.date)}><span><strong>{item.date}</strong><small>{item.summary || item.gain || '已记录'}</small></span><em>{['很累','偏低','平稳','不错','很好'][item.mood - 1]}</em></button>)}</div> : <p className="empty-copy">保存第一篇复盘后，可以按日期回看变化。</p>}</aside>
    </div>
  )
}

function MemoPanel({ user }: { user: User | null }) {
  const notes = useCollection('notes', user)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [query, setQuery] = useState('')
  const sorted = [...notes.items].filter((note) => `${note.title} ${note.content} ${note.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const openCreate = () => { setEditingId(null); setTitle(''); setContent(''); setTags(''); setShowForm(true) }
  const openEdit = (note: JournalNote) => { setEditingId(note.id); setTitle(note.title); setContent(note.content); setTags(note.tags.join(', ')); setShowForm(true) }

  const save = () => {
    if (!title.trim() || !content.trim()) return
    const previous = notes.items.find((item) => item.id === editingId)
    const note: JournalNote = {
      id: editingId || makeId(), title: title.trim(), content: content.trim(),
      tags: tags.split(/[,，]/).map((item) => item.trim()).filter(Boolean), date: previous?.date || today(), createdAt: previous?.createdAt || new Date().toISOString(),
    }
    notes.setItems((current) => editingId ? current.map((item) => item.id === editingId ? note : item) : [note, ...current])
    setTitle(''); setContent(''); setTags(''); setShowForm(false)
  }

  return (
    <section className="panel notes-panel">
      <div className="section-heading"><div><span className="eyebrow">随时记、以后找得到</span><h2>备忘录</h2></div><button className="button primary small" onClick={openCreate}><Plus size={16} /> 新建</button></div>
      <div className="memo-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、内容或标签" /></div>
      {sorted.length ? (
        <div className="notes-grid">
          {sorted.map((note) => (
            <article className="note-card" key={note.id}>
              <div className="note-date">{note.date.slice(5).replace('-', '/')}</div>
              <h3>{note.title}</h3><p>{note.content}</p>
              <div className="note-foot"><span>{note.tags.map((tag) => `#${tag}`).join(' ')}</span><span><button className="icon-button" onClick={() => openEdit(note)}><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => { if (window.confirm('删除这条备忘？')) notes.remove(note.id) }}><Trash2 size={15} /></button></span></div>
            </article>
          ))}
        </div>
      ) : <button className="empty-invite" onClick={openCreate}><Plus size={18} /><span><strong>{query ? '没有找到匹配的备忘' : '写下第一条备忘'}</strong><small>{query ? '换一个关键词，或新建一条备忘。' : '工作信息、灵感、资料链接都可以集中保存。'}</small></span></button>}
      {showForm && (
        <Modal title={editingId ? '编辑备忘' : '新建备忘'} onClose={() => setShowForm(false)}>
          <div className="form-stack">
            <label>标题<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="这条备忘讲什么" /></label>
            <label>内容<textarea rows={7} value={content} onChange={(event) => setContent(event.target.value)} placeholder="记录正文、链接或后续动作" /></label>
            <label>标签<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="代码, 工作, 灵感" /></label>
            <button className="button primary full" onClick={save}>保存备忘</button>
          </div>
        </Modal>
      )}
    </section>
  )
}

function SettingsPanel({ user }: { user: User | null }) {
  const [message, setMessage] = useState('')
  const migrate = async () => {
    if (!user) return
    setMessage('正在把本机数据同步到云端…')
    try {
      await migrateLocalCollections(user)
      setMessage('同步完成。重新打开页面后将读取云端数据。')
    } catch {
      setMessage('同步没有完成，请检查网络后再试。')
    }
  }
  const restore = async (file?: File) => {
    if (!file || !window.confirm('恢复会覆盖这台设备上的同名本机数据，继续吗？')) return
    try {
      const count = await restoreBackup(file)
      window.alert(`已恢复 ${count} 组数据，页面将重新打开。`)
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '备份恢复失败。')
    }
  }
  return (
    <div className="settings-grid">
      <section className="panel setting-card"><span className="setting-icon"><Download size={21} /></span><h2>备份与恢复</h2><p>下载代码进度、基金、收支、任务、复盘、英语和备忘数据。建议每月备份一次。</p><div className="setting-actions"><button className="button quiet" onClick={downloadBackup}><DatabaseBackup size={17} /> 下载备份</button><label className="button quiet file-button"><Upload size={17} /> 恢复备份<input hidden type="file" accept="application/json,.json" onChange={(event) => void restore(event.target.files?.[0])} /></label></div></section>
      <section className="panel setting-card"><span className="setting-icon"><Cloud size={21} /></span><h2>云同步</h2><p>{user ? `当前账户：${user.email}` : '当前是本机模式；连接 Supabase 后可跨设备同步。'}</p>{user && <button className="button quiet" onClick={() => void migrate()}>上传本机数据</button>}{message && <small className="setting-message">{message}</small>}</section>
      <section className="panel setting-card"><span className="setting-icon"><DatabaseBackup size={21} /></span><h2>旧版数据</h2><p>{hasLegacyData() ? '检测到旧版工作台数据。导出备份会一起保留，后续可做一次性迁移。' : '当前浏览器没有检测到旧版 workbench_v1 数据。'}</p></section>
    </div>
  )
}
