import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/LocaleContext'

export function PublicImage({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <figure className={`public-figure${className ? ` ${className}` : ''}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </figure>
  )
}

export function PublicHero({
  kicker,
  title,
  lead,
  compact,
  aside,
  children,
}: {
  kicker?: string
  title: string
  lead?: string
  compact?: boolean
  aside?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className={`public-hero${compact ? ' compact' : ''}${aside ? ' has-aside' : ''}`}>
      <div className="public-container public-hero-inner">
        <div className="public-hero-main">
          {kicker && <p className="public-kicker">{kicker}</p>}
          <h1>{title}</h1>
          {lead && <p className="public-lead">{lead}</p>}
          {children}
        </div>
        {aside && <div className="public-hero-aside">{aside}</div>}
      </div>
    </section>
  )
}

export function PublicCta({ title, text }: { title: string; text: string }) {
  const { t } = useI18n()
  return (
    <section className="public-cta">
      <div className="public-container public-cta-inner">
        <div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <div className="public-cta-actions">
          <Link to="/register" className="public-btn accent lg">{t('website.nav.getStarted')}</Link>
          <Link to="/login" className="public-btn ghost lg on-dark">{t('website.nav.signIn')}</Link>
        </div>
      </div>
    </section>
  )
}

export function PublicProse({
  title,
  hideTitle,
  children,
}: {
  title: string
  hideTitle?: boolean
  children: ReactNode
}) {
  return (
    <section className="public-prose-wrap">
      <article className="public-prose">
        {!hideTitle && <h1>{title}</h1>}
        {children}
      </article>
    </section>
  )
}
