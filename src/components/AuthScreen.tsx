import { useState } from 'react'
import { ArrowRight, CheckCircle2, KeyRound, Mail } from 'lucide-react'
import { requestEmailCode, verifyEmailCode } from '../lib/supabase'

export function AuthScreen() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
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
      setMessage('验证码已发送，请查看邮箱。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '验证码发送失败。')
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setMessage('请输入邮件中的 6 位验证码。')
      return
    }
    setBusy(true)
    try {
      await verifyEmailCode(email, code)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '验证码不正确或已失效。')
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
        <h2>{sent ? '输入验证码' : '登录进度本'}</h2>
        <p>{sent ? `我们已向 ${email} 发送邮件` : '首次登录也会自动创建账户'}</p>
        <label className="field-label" htmlFor="email">邮箱</label>
        <div className="input-with-icon">
          <Mail size={18} />
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={sent} placeholder="name@example.com" />
        </div>
        {sent && (
          <>
            <label className="field-label" htmlFor="code">6 位验证码</label>
            <div className="input-with-icon">
              <KeyRound size={18} />
              <input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" />
            </div>
          </>
        )}
        {message && <p className="form-message" role="status">{message}</p>}
        <button className="button primary auth-submit" onClick={sent ? verify : send} disabled={busy}>
          {busy ? '正在处理…' : sent ? '进入工作台' : '发送验证码'} <ArrowRight size={18} />
        </button>
        {sent && <button className="text-button" onClick={() => { setSent(false); setCode(''); setMessage('') }}>换一个邮箱</button>}
        <small>登录状态会保存在这台设备，正常使用无需每次验证。</small>
      </section>
    </main>
  )
}
