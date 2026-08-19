import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/home'
import { useI18n } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/messages'

const NAV = [
  { to: '/', key: 'website.nav.home', end: true },
  { to: '/about', key: 'website.nav.about', end: false },
  { to: '/contact', key: 'website.nav.contact', end: false },
] as const

export function PublicShell() {
  const { t, locale, setLocale } = useI18n()
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  const dashboard = user ? homeFor(user.roles) : null

  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-header-inner">
          <NavLink to="/" className="public-logo">
            Task<span>Near</span>
          </NavLink>

          <nav className="public-nav" aria-label={t('website.nav.main')}>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="public-nav-link">
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="public-header-actions">
            <div className="lang-switch compact public-lang">
              {(['en', 'hi'] as Locale[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={locale === code ? 'on' : ''}
                  onClick={() => void setLocale(code)}
                >
                  {code === 'en' ? 'EN' : 'हि'}
                </button>
              ))}
            </div>
            {dashboard ? (
              <NavLink to={dashboard} className="public-btn accent">{t('website.nav.dashboard')}</NavLink>
            ) : (
              <>
                <NavLink to="/login" className="public-btn ghost">{t('website.nav.signIn')}</NavLink>
                <NavLink to="/register" className="public-btn accent">{t('website.nav.getStarted')}</NavLink>
              </>
            )}
            <button
              type="button"
              className="icon-btn public-menu-btn"
              aria-expanded={menuOpen}
              aria-label={t('website.nav.menu')}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="menu-icon" aria-hidden />
            </button>
          </div>
        </div>

        <div className={`public-drawer${menuOpen ? ' open' : ''}`}>
          <nav className="public-drawer-nav">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="public-drawer-link">
                {t(item.key)}
              </NavLink>
            ))}
            <NavLink to="/privacy" className="public-drawer-link">{t('website.nav.privacy')}</NavLink>
            <NavLink to="/terms" className="public-drawer-link">{t('website.nav.terms')}</NavLink>
          </nav>
          <div className="public-drawer-actions">
            <div className="lang-switch compact public-drawer-lang">
              {(['en', 'hi'] as Locale[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={locale === code ? 'on' : ''}
                  onClick={() => void setLocale(code)}
                >
                  {code === 'en' ? 'EN' : 'हि'}
                </button>
              ))}
            </div>
            {dashboard ? (
              <NavLink to={dashboard} className="public-btn accent block">{t('website.nav.dashboard')}</NavLink>
            ) : (
              <>
                <NavLink to="/login" className="public-btn ghost block">{t('website.nav.signIn')}</NavLink>
                <NavLink to="/register" className="public-btn accent block">{t('website.nav.getStarted')}</NavLink>
              </>
            )}
          </div>
        </div>
        {menuOpen && (
          <button type="button" className="public-backdrop" aria-label={t('website.nav.close')} onClick={() => setMenuOpen(false)} />
        )}
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="public-footer-brand">
            <div className="public-logo">Task<span>Near</span></div>
            <p>{t('website.footer.tagline')}</p>
          </div>
          <div className="public-footer-links">
            <strong>{t('website.footer.company')}</strong>
            <NavLink to="/about">{t('website.nav.about')}</NavLink>
            <NavLink to="/contact">{t('website.nav.contact')}</NavLink>
          </div>
          <div className="public-footer-links">
            <strong>{t('website.footer.legal')}</strong>
            <NavLink to="/privacy">{t('website.nav.privacy')}</NavLink>
            <NavLink to="/terms">{t('website.nav.terms')}</NavLink>
          </div>
          <div className="public-footer-links">
            <strong>{t('website.footer.account')}</strong>
            <NavLink to="/login">{t('website.nav.signIn')}</NavLink>
            <NavLink to="/register">{t('website.nav.getStarted')}</NavLink>
          </div>
        </div>
        <div className="public-footer-copy">{t('website.footer.copy')}</div>
      </footer>
    </div>
  )
}
