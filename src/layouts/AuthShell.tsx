import type { ReactNode } from 'react'
import { useI18n } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/messages'

export function AuthShell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n()

  return (
    <div className="login">
      <section className="login-brand">
        <div>
          <div className="logo">Task<span>Near</span></div>
          <h1>{t('brand.tagline')}</h1>
          <p>{t('brand.blurb')}</p>
          <div className="login-pills">
            <span>Lucknow</span>
            <span>Events</span>
            <span>Weekday tasks</span>
          </div>
        </div>
        <p>{t('brand.city')}</p>
      </section>
      <section className="login-panel">
        <div className="login-box">
          <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
            <div className="lang-switch compact">
              {(['en', 'hi'] as Locale[]).map((code) => (
                <button key={code} type="button" className={locale === code ? 'on' : ''} onClick={() => void setLocale(code)}>
                  {code === 'en' ? 'EN' : 'हि'}
                </button>
              ))}
            </div>
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
