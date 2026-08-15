import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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

export function AppShell({ portal }: { portal: Portal }) {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const links = LINKS[portal]
  const tag = portal === 'client' ? t('nav.client') : portal === 'caterer' ? t('nav.caterer') : t('nav.ops')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">Task<span>Near</span></div>
        <div className="portal-tag">{tag}</div>
        <nav className="side-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to.split('/').length <= 2}>
              {t(l.key)}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <div className="side-user-row">
            <Avatar name={user?.name} src={user?.avatar_url} size={40} />
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.phone}</small>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            {t('nav.signOut')}
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="main-body">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
