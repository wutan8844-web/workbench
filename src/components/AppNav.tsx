import { BookOpenText, ChartNoAxesCombined, House, LayoutGrid, WalletCards } from 'lucide-react'
import type { AppView } from '../types'

const items = [
  { id: 'home' as const, label: '今天', icon: House },
  { id: 'learn' as const, label: '代码', icon: BookOpenText },
  { id: 'funds' as const, label: '基金', icon: ChartNoAxesCombined },
  { id: 'finance' as const, label: '收支', icon: WalletCards },
  { id: 'more' as const, label: '更多', icon: LayoutGrid },
]

export function AppNav({ active, onChange }: { active: AppView; onChange: (view: AppView) => void }) {
  return (
    <nav className="app-nav" aria-label="主导航">
      <button className="brand" onClick={() => onChange('home')} aria-label="返回今天">
        <span className="brand-mark">进</span>
        <span className="brand-name">进度本</span>
      </button>
      <div className="nav-items">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`nav-button ${active === item.id ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
              aria-current={active === item.id ? 'page' : undefined}
            >
              <Icon size={21} strokeWidth={active === item.id ? 2.4 : 1.9} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
      <p className="nav-motto">每天做一点<br />一年后不一样</p>
    </nav>
  )
}
