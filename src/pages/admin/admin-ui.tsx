import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AdminPage({ children }: { children: ReactNode }) {
  return <div className="page admin-page">{children}</div>
}

export function AdminAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="admin-alert err" role="alert">
      {message}
    </div>
  )
}

export function AdminTabs({ children }: { children: ReactNode }) {
  return <div className="tabs admin-tabs">{children}</div>
}

export function AdminTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className={active ? 'on' : ''} onClick={onClick}>
      {children}
    </button>
  )
}

export function AdminStats({ children }: { children: ReactNode }) {
  return <div className="admin-stats">{children}</div>
}

export function AdminStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="admin-stat card">
      <div className="card-kicker">{label}</div>
      <div className="stat">{value}</div>
    </div>
  )
}

export function AdminStatLink({ label, value, to }: { label: string; value: ReactNode; to: string }) {
  return (
    <Link to={to} className="card admin-stat-link">
      <div className="card-kicker">{label}</div>
      <div className="stat">{value}</div>
    </Link>
  )
}

export function AdminWorkspace({
  table,
  detail,
  even,
}: {
  table: ReactNode
  detail: ReactNode
  even?: boolean
}) {
  return (
    <div className={`admin-workspace split${even ? ' even' : ''}`}>
      <div className="admin-workspace-main">{table}</div>
      <div className="admin-workspace-detail">{detail}</div>
    </div>
  )
}

export function AdminTableCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="card flush admin-table-card">
      {title ? (
        <div className="admin-table-head">
          <div className="card-kicker">{title}</div>
        </div>
      ) : null}
      {children}
    </div>
  )
}

export function AdminDetailStack({ children }: { children: ReactNode }) {
  return <div className="side-panel admin-detail-stack">{children}</div>
}

export function AdminDetailCard({
  kicker,
  title,
  children,
  actions,
  empty,
}: {
  kicker?: string
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  empty?: string
}) {
  if (!children && empty) {
    return (
      <div className="card admin-detail empty-state">
        <p>{empty}</p>
      </div>
    )
  }

  return (
    <div className="card admin-detail">
      {kicker ? <div className="card-kicker">{kicker}</div> : null}
      {title ? <h2 className="admin-detail-title">{title}</h2> : null}
      {children ? <div className="admin-detail-body">{children}</div> : null}
      {actions ? <div className="admin-detail-actions btn-row">{actions}</div> : null}
    </div>
  )
}

export function AdminFormCard({
  kicker,
  hint,
  children,
  actions,
  narrow,
}: {
  kicker: string
  hint?: string
  children: ReactNode
  actions?: ReactNode
  narrow?: boolean
}) {
  return (
    <div className={`card admin-form-card${narrow ? ' narrow' : ''}`}>
      <div className="card-kicker">{kicker}</div>
      {hint ? <p className="admin-form-hint">{hint}</p> : null}
      {children}
      {actions ? <div className="admin-form-actions btn-row">{actions}</div> : null}
    </div>
  )
}

export function AdminBoardGrid({ children }: { children: ReactNode }) {
  return <div className="admin-board-grid">{children}</div>
}

export function AdminBoardCard({
  status,
  fillLabel,
  title,
  meta,
  action,
  children,
}: {
  status?: ReactNode
  fillLabel?: ReactNode
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="card admin-board-card">
      <div className="admin-board-card-head">
        <div className="admin-board-badges">
          {status}
          {fillLabel}
        </div>
      </div>
      <h2>{title}</h2>
      {meta ? <div className="meta admin-board-meta">{meta}</div> : null}
      {action ? <div className="admin-board-action btn-row">{action}</div> : null}
      {children ? <div className="admin-board-workers">{children}</div> : null}
    </div>
  )
}

export function AdminSection({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`admin-section${className ? ` ${className}` : ''}`}>
      {title ? <div className="admin-section-title card-kicker">{title}</div> : null}
      {children}
    </section>
  )
}

export function AdminEmpty({ message }: { message: string }) {
  return <div className="card admin-empty">{message}</div>
}
