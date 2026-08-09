export type EnglishWord = {
  word: string
  phonetic: string
  meaning: string
  example: string
  translation: string
}

export const ENGLISH_WORDS: EnglishWord[] = [
  { word: 'build', phonetic: '/bɪld/', meaning: '建造；制作', example: 'I build a small website.', translation: '我制作一个小网站。' },
  { word: 'learn', phonetic: '/lɜːn/', meaning: '学习', example: 'I learn something every day.', translation: '我每天都学习一点东西。' },
  { word: 'start', phonetic: '/stɑːt/', meaning: '开始', example: 'Let us start with HTML.', translation: '让我们从 HTML 开始。' },
  { word: 'finish', phonetic: '/ˈfɪnɪʃ/', meaning: '完成', example: 'I finish today’s lesson.', translation: '我完成今天的课程。' },
  { word: 'button', phonetic: '/ˈbʌtn/', meaning: '按钮', example: 'Click the blue button.', translation: '点击蓝色按钮。' },
  { word: 'page', phonetic: '/peɪdʒ/', meaning: '页面', example: 'This page is simple.', translation: '这个页面很简单。' },
  { word: 'color', phonetic: '/ˈkʌlə/', meaning: '颜色', example: 'Blue is my favorite color.', translation: '蓝色是我最喜欢的颜色。' },
  { word: 'number', phonetic: '/ˈnʌmbə/', meaning: '数字；号码', example: 'Type a six-digit number.', translation: '输入一个六位数。' },
  { word: 'money', phonetic: '/ˈmʌni/', meaning: '钱', example: 'I save some money each month.', translation: '我每个月存一点钱。' },
  { word: 'save', phonetic: '/seɪv/', meaning: '保存；节省', example: 'Save your work before you leave.', translation: '离开前保存你的工作。' },
  { word: 'plan', phonetic: '/plæn/', meaning: '计划', example: 'I have a plan for this week.', translation: '我有本周的计划。' },
  { word: 'today', phonetic: '/təˈdeɪ/', meaning: '今天', example: 'Today is a good day to learn.', translation: '今天是学习的好日子。' },
  { word: 'tomorrow', phonetic: '/təˈmɒrəʊ/', meaning: '明天', example: 'I will try again tomorrow.', translation: '我明天会再试一次。' },
  { word: 'small', phonetic: '/smɔːl/', meaning: '小的', example: 'Start with a small step.', translation: '从一小步开始。' },
  { word: 'change', phonetic: '/tʃeɪndʒ/', meaning: '改变', example: 'Change the title color.', translation: '改变标题颜色。' },
  { word: 'open', phonetic: '/ˈəʊpən/', meaning: '打开的；打开', example: 'Open the lesson on your phone.', translation: '在手机上打开课程。' },
  { word: 'close', phonetic: '/kləʊz/', meaning: '关闭', example: 'Close the window.', translation: '关闭窗口。' },
  { word: 'write', phonetic: '/raɪt/', meaning: '写', example: 'Write your name here.', translation: '在这里写下你的名字。' },
  { word: 'read', phonetic: '/riːd/', meaning: '读', example: 'Read the message again.', translation: '再读一遍这条信息。' },
  { word: 'check', phonetic: '/tʃek/', meaning: '检查', example: 'Check your answer.', translation: '检查你的答案。' },
  { word: 'answer', phonetic: '/ˈɑːnsə/', meaning: '答案；回答', example: 'The answer is correct.', translation: '答案是正确的。' },
  { word: 'question', phonetic: '/ˈkwestʃən/', meaning: '问题', example: 'Ask one clear question.', translation: '问一个清楚的问题。' },
  { word: 'right', phonetic: '/raɪt/', meaning: '正确的；右边', example: 'Your code is right.', translation: '你的代码是正确的。' },
  { word: 'wrong', phonetic: '/rɒŋ/', meaning: '错误的', example: 'This value is wrong.', translation: '这个值是错误的。' },
  { word: 'again', phonetic: '/əˈɡen/', meaning: '再一次', example: 'Please try again.', translation: '请再试一次。' },
  { word: 'before', phonetic: '/bɪˈfɔː/', meaning: '在……之前', example: 'Think before you click.', translation: '点击前先想一想。' },
  { word: 'after', phonetic: '/ˈɑːftə/', meaning: '在……之后', example: 'Review after the lesson.', translation: '课程后进行复习。' },
  { word: 'first', phonetic: '/fɜːst/', meaning: '第一；首先', example: 'HTML is the first step.', translation: 'HTML 是第一步。' },
  { word: 'next', phonetic: '/nekst/', meaning: '下一个', example: 'Go to the next lesson.', translation: '进入下一课。' },
  { word: 'result', phonetic: '/rɪˈzʌlt/', meaning: '结果', example: 'Look at the result.', translation: '看看结果。' },
]

export function wordsForToday(progress: EnglishProgress[] = []) {
  const day = Math.floor(Date.now() / 86400000)
  const today = new Date().toISOString().slice(0, 10)
  const byWord = new Map(progress.map((item) => [item.word, item]))
  const rotate = <T,>(items: T[], offset: number) => items.length
    ? [...items.slice(offset % items.length), ...items.slice(0, offset % items.length)]
    : []
  const due = ENGLISH_WORDS
    .filter((item) => {
      const saved = byWord.get(item.word)
      return saved && saved.nextReview <= today
    })
    .sort((a, b) => (byWord.get(a.word)?.nextReview || '').localeCompare(byWord.get(b.word)?.nextReview || ''))
  const unseen = rotate(ENGLISH_WORDS.filter((item) => !byWord.has(item.word)), day * 5)
  const later = rotate(ENGLISH_WORDS.filter((item) => {
    const saved = byWord.get(item.word)
    return saved && saved.nextReview > today
  }), day)
  return [...due, ...unseen, ...later].slice(0, 5)
}

export function speakWord(word: string) {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.82
  window.speechSynthesis.speak(utterance)
  return true
}
import type { EnglishProgress } from '../types'
