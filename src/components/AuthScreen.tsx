import { useState } from 'react'
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import { requestEmailCode } from '../lib/supabase'

export function AuthScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage('请先输入正确的邮箱地址。')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await requestEmailCode(email)
      setSent(true)
      setMessage('登录邮件已发送。打开邮件，点击里面的 Sign in 即可进入工作台。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '登录邮件发送失败。')
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
        <h2>{sent ? '去邮箱点登录链接' : '登录进度本'}</h2>
        <p>{sent ? `登录邮件已发送到 ${email}` : '首次登录也会自动创建账户'}</p>
        <label className="field-label" htmlFor="email">邮箱</label>
        <div className="input-with-icon">
          <Mail size={18} />
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={sent} placeholder="name@example.com" />
        </div>
        {message && <p className="form-message" role="status">{message}</p>}
        <button className="button primary auth-submit" onClick={send} disabled={busy}>
          {busy ? '正在处理…' : sent ? '重新发送邮件' : '发送登录邮件'} <ArrowRight size={18} />
        </button>
        {sent && <button className="text-button" onClick={() => { setSent(false); setMessage('') }}>换一个邮箱</button>}
        <small>登录状态会保存在这台设备，正常使用无需每次验证。</small>
      </section>
    </main>
  )
}
