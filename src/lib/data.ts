import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import {
  addTombstone,
  isSyncPending,
  readLocal,
  readTombstones,
  removeTombstone,
  setSyncPending,
  writeLocal,
} from './storage'
import type {
  DailyTask,
  DailyReview,
  EnglishProgress,
  FundPosition,
  JournalNote,
  LessonProgress,
  Transaction,
} from '../types'

export type LocalCollections = {
  transactions: Transaction[]
  funds: FundPosition[]
  progress: LessonProgress[]
  notes: JournalNote[]
  tasks: DailyTask[]
  reviews: DailyReview[]
  english: EnglishProgress[]
}

export type CollectionName = keyof LocalCollections

const tableByCollection: Record<CollectionName, string> = {
  transactions: 'transactions',
  funds: 'fund_positions',
  progress: 'lesson_progress',
  notes: 'journal_notes',
  tasks: 'daily_tasks',
  reviews: 'daily_reviews',
  english: 'english_progress',
}

function reportSync(state: 'saving' | 'saved' | 'error') {
  window.dispatchEvent(new CustomEvent('growth-ledger-sync', { detail: state }))
}

function rowKey(name: CollectionName) {
  return name === 'progress' ? 'lesson_id' : name === 'english' ? 'word' : 'id'
}

const mapFromDatabase: Record<CollectionName, (row: Record<string, unknown>) => unknown> = {
  transactions: (row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    note: row.note || '',
    date: row.happened_on,
    createdAt: row.created_at,
  }),
  funds: (row) => ({
    id: row.id,
    code: row.fund_code,
    name: row.fund_name,
    shares: Number(row.shares),
    cost: Number(row.cost),
    groupName: row.group_name || '我的持仓',
    createdAt: row.created_at,
  }),
  progress: (row) => ({
    lessonId: row.lesson_id,
    code: row.code || '',
    checksPassed: Number(row.checks_passed || 0),
    completed: Boolean(row.completed),
    attempts: Number(row.attempts || 0),
    updatedAt: row.updated_at,
  }),
  notes: (row) => ({
    id: row.id,
    title: row.title,
    content: row.content || '',
    tags: row.tags || [],
    date: row.note_date,
    createdAt: row.created_at,
  }),
  tasks: (row) => ({
    id: row.id,
    title: row.title,
    status: row.status || (row.done ? 'done' : 'todo'),
    priority: row.priority || 'medium',
    note: row.note || '',
    date: row.task_date,
    createdAt: row.created_at,
  }),
  reviews: (row) => ({
    id: row.id,
    date: row.review_date,
    summary: row.summary || '',
    gain: row.gain || '',
    lack: row.lack || '',
    plan: row.plan || '',
    mood: Number(row.mood || 3),
    updatedAt: row.updated_at,
  }),
  english: (row) => ({
    word: row.word,
    level: Number(row.level || 0),
    nextReview: row.next_review,
    updatedAt: row.updated_at,
  }),
}

function toDatabase(name: CollectionName, item: Record<string, unknown>, userId: string) {
  const common = { user_id: userId }
  if (name === 'transactions') {
    return { ...common, id: item.id, type: item.type, amount: item.amount, category: item.category, note: item.note, happened_on: item.date }
  }
  if (name === 'funds') {
    return { ...common, id: item.id, fund_code: item.code, fund_name: item.name, shares: item.shares, cost: item.cost, group_name: item.groupName }
  }
  if (name === 'progress') {
    return { ...common, lesson_id: item.lessonId, code: item.code, checks_passed: item.checksPassed, completed: item.completed, attempts: item.attempts, updated_at: item.updatedAt }
  }
  if (name === 'notes') {
    return { ...common, id: item.id, title: item.title, content: item.content, tags: item.tags, note_date: item.date }
  }
  if (name === 'tasks') {
    return { ...common, id: item.id, title: item.title, status: item.status, priority: item.priority, note: item.note, task_date: item.date }
  }
  if (name === 'reviews') {
    return { ...common, id: item.id, review_date: item.date, summary: item.summary, gain: item.gain, lack: item.lack, plan: item.plan, mood: item.mood, updated_at: item.updatedAt }
  }
  return { ...common, word: item.word, level: item.level, next_review: item.nextReview, updated_at: item.updatedAt }
}

export async function loadCollection<K extends CollectionName>(name: K, user: User | null): Promise<LocalCollections[K]> {
  const local = readLocal<LocalCollections[K]>(name, [] as unknown as LocalCollections[K])
  if (!supabase || !user) return local

  if (isSyncPending(name) && local.length) {
    reportSync('saving')
    const rows = (local as unknown as Record<string, unknown>[]).map((item) => toDatabase(name, item, user.id))
    const { error } = await supabase.from(tableByCollection[name]).upsert(rows)
    if (error) {
      reportSync('error')
      return local
    }
    setSyncPending(name, false)
  }

  const tombstones = readTombstones(name)
  for (const id of tombstones) {
    const { error } = await supabase.from(tableByCollection[name]).delete().eq(rowKey(name), id)
    if (error) {
      reportSync('error')
      return local
    }
    removeTombstone(name, id)
  }

  const { data, error } = await supabase.from(tableByCollection[name]).select('*')
  if (error) {
    reportSync('error')
    return local
  }
  const remote = (data || []).map((row) => mapFromDatabase[name](row as Record<string, unknown>)) as LocalCollections[K]
  writeLocal(name, remote)
  reportSync('saved')
  return remote
}

export async function saveCollection<K extends CollectionName>(name: K, items: LocalCollections[K], user: User | null) {
  writeLocal(name, items)
  if (!supabase || !user) return

  setSyncPending(name, true)
  reportSync('saving')
  const rows = (items as unknown as Record<string, unknown>[]).map((item) => toDatabase(name, item, user.id))
  if (!rows.length) {
    setSyncPending(name, false)
    reportSync('saved')
    return
  }
  const { error } = await supabase.from(tableByCollection[name]).upsert(rows)
  if (error) {
    reportSync('error')
    return
  }
  setSyncPending(name, false)
  reportSync('saved')
}

export async function deleteRemote(name: CollectionName, id: string, user: User | null) {
  if (!supabase || !user) return
  addTombstone(name, id)
  reportSync('saving')
  const { error } = await supabase.from(tableByCollection[name]).delete().eq(rowKey(name), id)
  if (error) {
    reportSync('error')
    return
  }
  removeTombstone(name, id)
  reportSync('saved')
}

export async function migrateLocalCollections(user: User) {
  if (!supabase) return
  const names = Object.keys(tableByCollection) as CollectionName[]
  for (const name of names) {
    const items = readLocal<Record<string, unknown>[]>(name, [])
    if (!items.length) continue
    const rows = items.map((item) => toDatabase(name, item, user.id))
    const { error } = await supabase.from(tableByCollection[name]).upsert(rows)
    if (error) throw error
  }
}
