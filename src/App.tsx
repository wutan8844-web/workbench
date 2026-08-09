import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Cloud, CloudOff, LogOut } from 'lucide-react'
import { supabase, isCloudConfigured } from './lib/supabase'
import type { AppView } from './types'
import { AppNav } from './components/AppNav'
import { AuthScreen } from './components/AuthScreen'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { FundsPage } from './pages/FundsPage'
import { FinancePage } from './pages/FinancePage'
import { MorePage } from './pages/MorePage'

const VIEW_TITLES: Record<AppView, string> = {
  home: '今天', learn: '代码课', funds: '基金', finance: '收支', more: '更多',
}

function viewFromHash(): AppView {
  const value = window.location.hash.replace('#/', '') as AppView
  return value in VIEW_TITLES ? value : 'home'
}

export default function App() {
  const [view, setViewState] = useState<AppView>(viewFromHash)
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(isCloudConfigured)
  const [syncState, setSyncState] = useState<'saving' | 'saved' | 'error'>('saved')

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setCheckingAuth(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setCheckingAuth(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onSync = (event: Event) => setSyncState((event as CustomEvent<'saving' | 'saved' | 'error'>).detail)
    window.addEventListener('growth-ledger-sync', onSync)
    return () => window.removeEventListener('growth-ledger-sync', onSync)
  }, [])

  useEffect(() => {
    const onHashChange = () => setViewState(viewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const setView = (next: AppView) => {
    window.location.hash = `/${next}`
    setViewState(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const todayLabel = useMemo(() => new Intl.DateTimeFormat('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'short',
  }).format(new Date()), [])

  if (checkingAuth) {
    return <div className="app-loading"><div className="loading-mark">进</div><p>正在恢复登录状态…</p></div>
  }

  if (isCloudConfigured && !user) return <AuthScreen />

  return (
    <div className="app-shell">
      <AppNav active={view} onChange={setView} />
      <main className="app-main">
        <header className="topbar">
          <div>
            <span className="topbar-date">{todayLabel}</span>
            <h1>{VIEW_TITLES[view]}</h1>
          </div>
          <div className={`account-state ${syncState === 'error' ? 'sync-error' : ''}`} title={isCloudConfigured ? user?.email : '数据仅保存在当前设备'}>
            {isCloudConfigured && syncState !== 'error' ? <Cloud size={16} /> : <CloudOff size={16} />}
            <span>{!isCloudConfigured ? '本机模式' : syncState === 'saving' ? '正在同步' : syncState === 'error' ? '等待联网' : '已同步'}</span>
            {user && supabase && (
              <button className="icon-button" aria-label="退出登录" onClick={() => void supabase?.auth.signOut()}>
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>

        <div className="page-stage">
          {view === 'home' && <HomePage user={user} go={setView} />}
          {view === 'learn' && <LearnPage user={user} />}
          {view === 'funds' && <FundsPage user={user} />}
          {view === 'finance' && <FinancePage user={user} />}
          {view === 'more' && <MorePage user={user} />}
        </div>
      </main>
    </div>
  )
}
