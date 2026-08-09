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

export async function requestEmailCode(email: string) {
  if (!supabase) throw new Error('尚未连接 Supabase')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) throw error
}

export async function verifyEmailCode(email: string, token: string) {
  if (!supabase) throw new Error('尚未连接 Supabase')
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}
