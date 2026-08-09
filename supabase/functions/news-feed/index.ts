const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const feeds = [
  { source: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { source: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
  { source: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
  { source: 'arXiv cs.AI', url: 'https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=8' },
]

function textOf(block: string, tag: string) {
  const cdata = block.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'))
  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return (cdata?.[1] || plain?.[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decode(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
}

function parseFeed(xml: string, source: string) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2])
  return blocks.slice(0, 10).map((block, index) => {
    const title = decode(textOf(block, 'title'))
    const rssLink = textOf(block, 'link')
    const atomLink = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || ''
    const url = decode(rssLink || atomLink)
    const publishedAt = textOf(block, 'pubDate') || textOf(block, 'published') || textOf(block, 'updated')
    const summary = decode(textOf(block, 'description') || textOf(block, 'summary')).slice(0, 180)
    return { id: `${source}-${index}-${url}`, title, url, source, publishedAt, summary }
  }).filter((item) => item.title && /^https?:\/\//.test(item.url))
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const settled = await Promise.allSettled(feeds.map(async (feed) => {
    const response = await fetch(feed.url, { headers: { 'User-Agent': 'GrowthLedger/2.0' } })
    if (!response.ok) throw new Error(`${feed.source}: ${response.status}`)
    return parseFeed(await response.text(), feed.source)
  }))
  const items = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 30)
  return Response.json({ items, fetchedAt: new Date().toISOString() }, {
    status: items.length ? 200 : 502,
    headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=900, s-maxage=1800' },
  })
})
