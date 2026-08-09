import type { NewsItem } from '../types'
import { supabase } from './supabase'

type HNHit = {
  objectID: string
  title?: string
  story_title?: string
  url?: string
  story_url?: string
  created_at: string
  author: string
}

export async function fetchRealNews(): Promise<NewsItem[]> {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('news-feed')
    if (!error && Array.isArray(data?.items) && data.items.length) return data.items as NewsItem[]
  }

  const response = await fetch('https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=20')
  if (!response.ok) throw new Error('暂时无法获取新闻。')
  const data = await response.json() as { hits: HNHit[] }
  return data.hits
    .filter((item) => (item.title || item.story_title) && (item.url || item.story_url))
    .map((item) => ({
      id: item.objectID,
      title: item.title || item.story_title || '',
      url: item.url || item.story_url || '',
      source: new URL(item.url || item.story_url || 'https://news.ycombinator.com').hostname.replace('www.', ''),
      publishedAt: item.created_at,
      summary: `Hacker News 收录 · ${item.author}`,
    }))
}
