import { ArrowRight, BookOpenText, Check, CircleDollarSign, Plus, TrendingUp } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { AppView, DailyTask } from '../types'
import { useCollection } from '../hooks/useCollection'
import { nextLesson, LESSONS } from '../data/curriculum'
import { makeId, money, monthKey, today } from '../lib/format'

export function HomePage({ user, go }: { user: User | null; go: (view: AppView) => void }) {
  const progress = useCollection('progress', user)
  const funds = useCollection('funds', user)
  const transactions = useCollection('transactions', user)
  const tasks = useCollection('tasks', user)
  const lesson = nextLesson(progress.items)
  const completed = progress.items.filter((item) => item.completed).length
  const monthTransactions = transactions.items.filter((item) => item.date.startsWith(monthKey()))
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expense = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const todayTasks = tasks.items.filter((item) => item.date === today())

  const addTask = () => {
    const title = window.prompt('今天还要完成什么？')?.trim()
    if (!title) return
    const task: DailyTask = { id: makeId(), title, status: 'todo', priority: 'medium', note: '', date: today(), createdAt: new Date().toISOString() }
    tasks.setItems((current) => [task, ...current])
  }

  const toggleTask = (id: string) => {
    tasks.setItems((current) => current.map((item) => item.id === id ? { ...item, status: item.status === 'done' ? 'todo' : 'done' } : item))
  }

  return (
    <div className="home-layout">
      <section className="daily-ticket">
        <div className="ticket-binding" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <div className="ticket-copy">
          <span className="eyebrow">今日学习票 · DAY {lesson.day}</span>
          <h2>{lesson.title}</h2>
          <p>{lesson.objective}</p>
          <button className="button ticket-action" onClick={() => go('learn')}>
            继续今天的 20 分钟 <ArrowRight size={18} />
          </button>
        </div>
        <div className="twenty-mark" aria-label="课程时长20分钟">
          <strong>20</strong><span>MIN</span>
        </div>
      </section>

      <section className="pulse-grid panel" aria-label="代码、基金与收支概况">
        <button className="pulse-card learn-pulse" onClick={() => go('learn')}>
          <span className="pulse-icon"><BookOpenText size={20} /></span>
          <span><small>代码进度</small><strong>{completed} / {LESSONS.length} 课</strong></span>
          <ArrowRight size={17} />
        </button>
        <button className="pulse-card fund-pulse" onClick={() => go('funds')}>
          <span className="pulse-icon"><TrendingUp size={20} /></span>
          <span><small>基金持仓</small><strong>{funds.items.length ? `${funds.items.length} 只` : '添加第一只'}</strong></span>
          <ArrowRight size={17} />
        </button>
        <button className="pulse-card finance-pulse" onClick={() => go('finance')}>
          <span className="pulse-icon"><CircleDollarSign size={20} /></span>
          <span><small>本月结余</small><strong className={income - expense < 0 ? 'negative' : ''}>{money(income - expense)}</strong></span>
          <ArrowRight size={17} />
        </button>
      </section>

      <section className="panel task-panel">
        <div className="section-heading">
          <div><span className="eyebrow">今天只抓重点</span><h2>三件小事</h2></div>
          <button className="button quiet small" onClick={addTask}><Plus size={16} /> 添加</button>
        </div>
        {todayTasks.length ? (
          <div className="task-list">
            {todayTasks.slice(0, 3).map((task) => (
              <button className={`task-row ${task.status === 'done' ? 'done' : ''}`} key={task.id} onClick={() => toggleTask(task.id)}>
                <span className="task-check">{task.status === 'done' && <Check size={15} />}</span>
                <span>{task.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <button className="empty-invite" onClick={addTask}>
            <Plus size={18} /><span><strong>写下今天最重要的一件事</strong><small>首页只显示前三件，做完比列满更重要。</small></span>
          </button>
        )}
      </section>

      <aside className="home-aside">
        <section className="panel month-note">
          <span className="eyebrow">本月钱流向哪里</span>
          <div className="month-balance">
            <div><small>收入</small><strong>{money(income)}</strong></div>
            <div><small>支出</small><strong>{money(expense)}</strong></div>
          </div>
          <button className="text-link" onClick={() => go('finance')}>查看明细 <ArrowRight size={15} /></button>
        </section>
        <section className="panel consistency-note">
          <span className="eyebrow">学习提醒</span>
          <blockquote>“先运行，再理解；先做小网页，再谈学会编程。”</blockquote>
          <p>今天只需要完成第 {lesson.day} 课。</p>
        </section>
      </aside>
    </div>
  )
}
