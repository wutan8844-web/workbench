import { useState } from 'react'
import { ArrowRight, CheckCircle2, Github } from 'lucide-react'
import { signInWithGitHub } from '../lib/supabase'

export function AuthScreen() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const login = async () => {
    setBusy(true)
    setMessage('')
    try {
      await signInWithGitHub()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'GitHub 登录没有成功，请重试。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <span className="auth-kicker">个人成长工作台</span>
        <h1>今天二十分钟，<br />把网站做出来。</h1>
        <p>从零学前端与后端，同时看清基金和每月收支。一次登录，数据会在你的设备之间同步。</p>
        <div className="auth-promises">
          <span><CheckCircle2 size={18} /> 课程有练习和自动检查</span>
          <span><CheckCircle2 size={18} /> 基金数据标明来源和时间</span>
          <span><CheckCircle2 size={18} /> 财务数据只属于你的账户</span>
        </div>
      </section>
      <section className="auth-card">
        <div className="brand-mark auth-logo">进</div>
        <h2>登录进度本</h2>
        <p>不需要邮箱验证码，在 GitHub 确认后会自动回来</p>
        {message && <p className="form-message" role="status">{message}</p>}
        <button className="button primary auth-submit" onClick={login} disabled={busy}>
          <Github size={19} /> {busy ? '正在打开 GitHub…' : '使用 GitHub 登录'} <ArrowRight size={18} />
        </button>
        <small>第一次需要确认授权。之后会保持登录，正常使用不用重复操作。</small>
      </section>
    </main>
  )
}
