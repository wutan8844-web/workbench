import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isCloudConfigured = Boolean(url && publishableKey)

export const supabase = isCloudConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export async function signInWithGitHub() {
  if (!supabase) throw new Error('尚未连接 Supabase')
  const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  })
  if (error) throw error
}
