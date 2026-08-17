import { NavLink, Outlet } from 'react-router-dom'
import { LoginBrandVisual } from '../components/LoginBrandVisual'
import { useI18n } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/messages'

export function AuthShell() {
  const { t, locale, setLocale } = useI18n()

  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-head">
            <div className="logo">Task<span>Near</span></div>
            <span className="auth-brand-badge">{t('brand.badge')}</span>
          </div>
          <h1>{t('brand.tagline')}</h1>
          <p className="auth-brand-lead">{t('brand.blurb')}</p>
          <LoginBrandVisual />
          <p className="auth-brand-foot">{t('brand.city')}</p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-main-inner">
          <header className="auth-toolbar">
            <nav className="auth-route-tabs" aria-label={t('login.portal')}>
              <NavLink to="/login" className={({ isActive }) => `auth-route-tab${isActive ? ' on' : ''}`}>
                {t('login.title')}
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => `auth-route-tab${isActive ? ' on' : ''}`}>
                {t('register.title')}
              </NavLink>
            </nav>
            <div className="lang-switch compact">
              {(['en', 'hi'] as Locale[]).map((code) => (
                <button key={code} type="button" className={locale === code ? 'on' : ''} onClick={() => void setLocale(code)}>
                  {code === 'en' ? 'EN' : 'हि'}
                </button>
              ))}
            </div>
          </header>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
