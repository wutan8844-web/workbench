export type AppView = 'home' | 'learn' | 'funds' | 'finance' | 'more'

export type LessonCheck = {
  label: string
  test: (code: string) => boolean
}

export type Lesson = {
  id: string
  stage: string
  day: number
  title: string
  eyebrow: string
  minutes: number
  objective: string
  explanation: string[]
  remember: string
  starter: string
  hint: string
  checks: LessonCheck[]
}

export type LessonProgress = {
  lessonId: string
  code: string
  checksPassed: number
  completed: boolean
  attempts: number
  updatedAt: string
}

export type TransactionType = 'expense' | 'income' | 'transfer'

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  category: string
  note: string
  date: string
  createdAt: string
}

export type FundPosition = {
  id: string
  code: string
  name: string
  shares: number
  cost: number
  groupName: string
  createdAt: string
}

export type FundQuote = {
  code: string
  name: string
  nav: number
  changePercent: number
  valueDate: string
  updatedAt: string
  source: string
  status: 'fresh' | 'stale'
}

export type NewsItem = {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  summary?: string
}

export type JournalNote = {
  id: string
  title: string
  content: string
  tags: string[]
  date: string
  createdAt: string
}

export type DailyTask = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 'high' | 'medium' | 'low'
  note: string
  date: string
  createdAt: string
}

export type DailyReview = {
  id: string
  date: string
  summary: string
  gain: string
  lack: string
  plan: string
  mood: number
  updatedAt: string
}

export type EnglishProgress = {
  word: string
  level: number
  nextReview: string
  updatedAt: string
}
