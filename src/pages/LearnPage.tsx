import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Check, CheckCircle2, ChevronRight, Circle, Clock3, Lightbulb, Pause, Play, RotateCcw, Route, Sparkles } from 'lucide-react'
import { LESSONS, ROADMAP, nextLesson } from '../data/curriculum'
import { useCollection } from '../hooks/useCollection'
import type { LessonProgress } from '../types'

function buildPreview(code: string) {
  const bridge = `<script>window.onerror=function(message){document.body.insertAdjacentHTML('beforeend','<pre style="color:#b4233c;background:#fff0f2;padding:12px;white-space:pre-wrap">'+message+'</pre>')}</script>`
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;padding:18px;color:#17223b;line-height:1.6}button,input{font:inherit;padding:8px}img{max-width:100%}</style>${bridge}</head><body>${code}</body></html>`
}

export function LearnPage({ user }: { user: User | null }) {
  const progress = useCollection('progress', user)
  const initial = nextLesson(progress.items)
  const [lessonId, setLessonId] = useState(initial.id)
  const lesson = LESSONS.find((item) => item.id === lessonId) || initial
  const saved = progress.items.find((item) => item.lessonId === lesson.id)
  const [code, setCode] = useState(saved?.code || lesson.starter)
  const [previewKey, setPreviewKey] = useState(0)
  const [results, setResults] = useState<boolean[] | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [seconds, setSeconds] = useState(20 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [labPane, setLabPane] = useState<'code' | 'preview'>('code')
  const resumedAfterLoad = useRef(false)

  useEffect(() => {
    if (!progress.loading && !resumedAfterLoad.current) {
      resumedAfterLoad.current = true
      setLessonId(nextLesson(progress.items).id)
    }
  }, [progress.loading, progress.items])

  useEffect(() => {
    if (!timerRunning) return
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        setTimerRunning(false)
        return 0
      }
      return value - 1
    }), 1000)
    return () => window.clearInterval(timer)
  }, [timerRunning])

  useEffect(() => {
    const item = progress.items.find((entry) => entry.lessonId === lesson.id)
    setCode(item?.code || lesson.starter)
    setResults(null)
    setShowHint(false)
    setSeconds(20 * 60)
    setTimerRunning(false)
  }, [lesson.id, progress.loading])

  const completedSet = useMemo(() => new Set(progress.items.filter((item) => item.completed).map((item) => item.lessonId)), [progress.items])
  const completedCount = completedSet.size
  const percent = Math.round((completedCount / LESSONS.length) * 100)

  const run = () => {
    setPreviewKey((value) => value + 1)
    setLabPane('preview')
  }
  const check = () => {
    const nextResults = lesson.checks.map((item) => item.test(code))
    setResults(nextResults)
    const allPassed = nextResults.every(Boolean)
    const next: LessonProgress = {
      lessonId: lesson.id,
      code,
      checksPassed: nextResults.filter(Boolean).length,
      completed: allPassed,
      attempts: (saved?.attempts || 0) + 1,
      updatedAt: new Date().toISOString(),
    }
    progress.setItems((current) => [...current.filter((item) => item.lessonId !== lesson.id), next])
    if (allPassed) setPreviewKey((value) => value + 1)
  }

  const selectLesson = (id: string) => {
    setLessonId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="learn-page">
      <section className="course-status panel">
        <div className="course-progress-copy">
          <span className="eyebrow">从零做网站 · 第一阶段</span>
          <h2>已完成 {completedCount} 课</h2>
          <div className="progress-track"><i style={{ width: `${percent}%` }} /></div>
          <small>{percent}% · 完成练习才能计入进度</small>
        </div>
        <button className="button quiet" onClick={() => setShowRoadmap((value) => !value)}><Route size={17} /> 全年路线</button>
      </section>

      {showRoadmap && (
        <section className="roadmap-panel panel">
          {ROADMAP.map((stage, index) => (
            <div className={`roadmap-row ${stage.status}`} key={stage.name}>
              <span className="roadmap-index">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{stage.name}</strong><small>{stage.detail}</small></span>
              <span className="roadmap-week">{stage.weeks}</span>
            </div>
          ))}
        </section>
      )}

      <div className="lesson-layout">
        <aside className="lesson-list panel">
          <div className="section-heading compact"><h2>课程目录</h2><small>{LESSONS.length} 课</small></div>
          <div className="lesson-scroll">
            {LESSONS.map((item) => (
              <button className={`lesson-link ${item.id === lesson.id ? 'active' : ''}`} key={item.id} onClick={() => selectLesson(item.id)}>
                <span className={`lesson-state ${completedSet.has(item.id) ? 'completed' : ''}`}>{completedSet.has(item.id) ? <Check size={14} /> : item.day}</span>
                <span><small>{item.eyebrow}</small><strong>{item.title}</strong></span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </aside>

        <article className="lesson-workspace">
          <section className="lesson-brief panel">
            <div className="lesson-meta">
              <span>{lesson.eyebrow}</span>
              <span className="timer-pill"><Clock3 size={15} /> {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
            </div>
            <h2>{lesson.title}</h2>
            <p className="lesson-objective">今天完成：{lesson.objective}</p>
            <div className="lesson-explain">
              {lesson.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <div className="remember-note"><Sparkles size={18} /><span><strong>记住这一句</strong>{lesson.remember}</span></div>
            <div className="lesson-controls">
              <button className="button quiet" onClick={() => setTimerRunning((value) => !value)}>
                {timerRunning ? <Pause size={17} /> : <Play size={17} />} {timerRunning ? '暂停计时' : seconds === 20 * 60 ? '开始20分钟' : '继续计时'}
              </button>
              <button className="text-button" onClick={() => { setSeconds(20 * 60); setTimerRunning(false) }}><RotateCcw size={15} /> 重置</button>
            </div>
          </section>

          <section className="code-lab panel">
            <div className="lab-heading">
              <div><span className="eyebrow">动手练习</span><h2>改完代码，看看结果</h2></div>
              <button className="text-button" onClick={() => setShowHint((value) => !value)}><Lightbulb size={16} /> {showHint ? '收起提示' : '需要提示'}</button>
            </div>
            {showHint && <div className="hint-box"><Lightbulb size={17} /><span>{lesson.hint}</span></div>}
            <div className="lab-view-switch" aria-label="代码练习视图">
              <button className={labPane === 'code' ? 'active' : ''} aria-pressed={labPane === 'code'} onClick={() => setLabPane('code')}>写代码</button>
              <button className={labPane === 'preview' ? 'active' : ''} aria-pressed={labPane === 'preview'} onClick={() => setLabPane('preview')}>看结果</button>
            </div>
            <div className="lab-grid">
              <div className={`editor-pane ${labPane !== 'code' ? 'mobile-hidden' : ''}`}>
                <div className="pane-label"><span>你的代码</span><small>可直接修改</small></div>
                <textarea className="code-editor" value={code} onChange={(event) => { setCode(event.target.value); setResults(null) }} spellCheck={false} aria-label="代码编辑器" />
              </div>
              <div className={`preview-pane ${labPane !== 'preview' ? 'mobile-hidden' : ''}`}>
                <div className="pane-label"><span>运行结果</span><button onClick={run}>刷新</button></div>
                <iframe key={previewKey} title="代码运行结果" sandbox="allow-scripts" srcDoc={buildPreview(code)} />
              </div>
            </div>
            <div className="lab-footer">
              <button className="button quiet" onClick={run}><Play size={17} /> 运行代码</button>
              <button className="button primary" onClick={check}><CheckCircle2 size={17} /> 检查答案</button>
            </div>
          </section>

          <section className={`check-panel panel ${results?.every(Boolean) ? 'passed' : ''}`}>
            <div className="section-heading compact">
              <div><span className="eyebrow">自动检查</span><h2>{results?.every(Boolean) ? '这课真的完成了' : '完成下面三项'}</h2></div>
              {results?.every(Boolean) && <span className="pass-badge">已通过</span>}
            </div>
            <div className="checks-list">
              {lesson.checks.map((item, index) => (
                <div className={results ? (results[index] ? 'check-ok' : 'check-miss') : ''} key={item.label}>
                  {results?.[index] ? <CheckCircle2 size={19} /> : <Circle size={19} />}<span>{item.label}</span>
                </div>
              ))}
            </div>
            {results && !results.every(Boolean) && <p className="result-help">还有未通过的项目。对照提示修改后，再点一次“检查答案”。</p>}
          </section>
        </article>
      </div>
    </div>
  )
}
