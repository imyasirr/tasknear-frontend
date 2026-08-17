import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { useI18n } from '../i18n/LocaleContext'

type Portal = 'client' | 'admin' | 'caterer'

const LINKS: Record<Portal, { to: string; key: string }[]> = {
  client: [
    { to: '/app', key: 'nav.bookings' },
    { to: '/app/events/new', key: 'nav.newEvent' },
    { to: '/app/tasks/new', key: 'nav.postTask' },
    { to: '/app/plans', key: 'nav.plans' },
    { to: '/app/settings', key: 'nav.settings' },
  ],
  caterer: [
    { to: '/caterer', key: 'nav.jobs' },
    { to: '/caterer/earnings', key: 'nav.earnings' },
    { to: '/caterer/profile', key: 'nav.company' },
    { to: '/caterer/settings', key: 'nav.settings' },
  ],
  admin: [
    { to: '/admin', key: 'nav.desk' },
    { to: '/admin/events', key: 'nav.events' },
    { to: '/admin/tasks', key: 'nav.tasks' },
    { to: '/admin/cities', key: 'nav.cities' },
    { to: '/admin/users', key: 'nav.users' },
    { to: '/admin/payouts', key: 'nav.payouts' },
    { to: '/admin/matching', key: 'nav.matching' },
    { to: '/admin/reports', key: 'nav.reports' },
    { to: '/admin/activity', key: 'nav.activity' },
    { to: '/admin/billing', key: 'nav.billing' },
    { to: '/admin/settings', key: 'nav.settings' },
  ],
}

type LinkRow = { to: string; key: string }

function SideNav({ links, onNavigate }: { links: LinkRow[]; onNavigate?: () => void }) {
  const { t } = useI18n()

  return (
    <nav className="side-nav">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to.split('/').length <= 2} onClick={onNavigate}>
          {t(l.key)}
        </NavLink>
      ))}
    </nav>
  )
}

function SideUser({ onDone }: { onDone?: () => void }) {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="side-user">
      <div className="side-user-row">
        <Avatar name={user?.name} src={user?.avatar_url} size={40} />
        <div className="side-user-meta">
          <strong>{user?.name}</strong>
          <small>{user?.phone}</small>
        </div>
      </div>
      <button
        type="button"
        onClick={async () => {
          await logout()
          onDone?.()
          navigate('/login')
        }}
      >
        {t('nav.signOut')}
      </button>
    </div>
  )
}

function Brand({ tag, compact }: { tag: string; compact?: boolean }) {
  return (
    <div className={`sidebar-brand${compact ? ' compact' : ''}`}>
      <div className={`logo${compact ? ' compact' : ''}`}>Task<span>Near</span></div>
      <div className={`portal-tag${compact ? ' compact' : ''}`}>{tag}</div>
    </div>
  )
}

export function AppShell({ portal }: { portal: Portal }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const links = LINKS[portal]
  const tag = portal === 'client' ? t('nav.client') : portal === 'caterer' ? t('nav.caterer') : t('nav.ops')
  const closeDrawer = () => setDrawerOpen(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', drawerOpen)
    return () => document.body.classList.remove('nav-open')
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className="app">
      <aside className="sidebar sidebar-desktop" aria-label={t('nav.menu')}>
        <Brand tag={tag} />
        <SideNav links={links} />
        <SideUser />
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-expanded={drawerOpen}
            aria-controls="app-drawer"
            aria-label={t('nav.menu')}
            onClick={() => setDrawerOpen(true)}
          >
            <span className="menu-icon" aria-hidden="true" />
          </button>
          <div className="topbar-brand">
            <div className="logo compact">Task<span>Near</span></div>
            <span className="portal-tag compact">{tag}</span>
          </div>
          <Avatar name={user?.name} src={user?.avatar_url} size={36} />
        </header>

        <div
          className={`drawer-backdrop${drawerOpen ? ' open' : ''}`}
          onClick={closeDrawer}
          aria-hidden={!drawerOpen}
        />

        <aside
          id="app-drawer"
          className={`sidebar drawer${drawerOpen ? ' open' : ''}`}
          aria-hidden={!drawerOpen}
          aria-label={t('nav.menu')}
        >
          <div className="drawer-head">
            <Brand tag={tag} compact />
            <button type="button" className="icon-btn drawer-close" aria-label={t('nav.closeMenu')} onClick={closeDrawer}>
              ×
            </button>
          </div>
          <SideNav links={links} onNavigate={closeDrawer} />
          <SideUser onDone={closeDrawer} />
        </aside>

        <main className="main">
          <div className="main-body">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
