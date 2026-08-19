import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/LocaleContext'
import { publicImages } from './media'
import { PublicCta, PublicHero, PublicImage } from './PublicPage'

export function HomePage() {
  const { t } = useI18n()

  const steps = [
    { n: '1', title: t('website.home.step1Title'), text: t('website.home.step1Text') },
    { n: '2', title: t('website.home.step2Title'), text: t('website.home.step2Text') },
    { n: '3', title: t('website.home.step3Title'), text: t('website.home.step3Text') },
  ]

  const audiences = [
    {
      title: t('website.home.forClients'),
      text: t('website.home.forClientsText'),
      to: '/register',
      image: publicImages.homeClients,
      alt: t('website.home.imgClients'),
    },
    {
      title: t('website.home.forProviders'),
      text: t('website.home.forProvidersText'),
      to: '/register',
      image: publicImages.homeProviders,
      alt: t('website.home.imgProviders'),
    },
  ]

  return (
    <>
      <PublicHero
        kicker={t('website.home.kicker')}
        title={t('website.home.title')}
        lead={t('website.home.lead')}
        aside={(
          <PublicImage
            src={publicImages.homeHero}
            alt={t('website.home.imgHero')}
            className="public-hero-img"
          />
        )}
      >
        <div className="public-hero-actions">
          <Link to="/register" className="public-btn accent lg">{t('website.home.ctaPrimary')}</Link>
          <Link to="/login" className="public-btn ghost lg on-hero">{t('website.home.ctaSecondary')}</Link>
        </div>
      </PublicHero>

      <section className="public-hero-stats-bar" aria-label={t('website.home.statsLabel')}>
        <div className="public-container">
          <ul className="public-hero-stats inline">
            <li><strong>{t('website.home.stat1Val')}</strong><span>{t('website.home.stat1Label')}</span></li>
            <li><strong>{t('website.home.stat2Val')}</strong><span>{t('website.home.stat2Label')}</span></li>
            <li><strong>{t('website.home.stat3Val')}</strong><span>{t('website.home.stat3Label')}</span></li>
          </ul>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <p className="public-kicker center">{t('website.home.howKicker')}</p>
          <h2 className="public-section-title center">{t('website.home.howTitle')}</h2>
          <div className="public-steps">
            {steps.map((step) => (
              <div key={step.n} className="public-step">
                <span className="public-step-n">{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section muted">
        <div className="public-container">
          <h2 className="public-section-title center">{t('website.home.audienceTitle')}</h2>
          <div className="public-audience-grid">
            {audiences.map((item) => (
              <div key={item.title} className="public-audience-card">
                <PublicImage src={item.image} alt={item.alt} className="public-card-img" />
                <div className="public-audience-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <Link to={item.to} className="public-link">{t('website.home.learnMore')} →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container public-trust-grid">
          <div className="public-trust-copy">
            <p className="public-kicker">{t('website.home.trustKicker')}</p>
            <h2>{t('website.home.trustTitle')}</h2>
            <p>{t('website.home.trustText')}</p>
          </div>
          <div className="public-trust-media">
            <PublicImage
              src={publicImages.homeProviders}
              alt={t('website.home.imgTrust')}
              className="public-trust-img"
            />
            <ul className="public-trust-list">
              <li>{t('website.home.trust1')}</li>
              <li>{t('website.home.trust2')}</li>
              <li>{t('website.home.trust3')}</li>
              <li>{t('website.home.trust4')}</li>
            </ul>
          </div>
        </div>
      </section>

      <PublicCta title={t('website.home.ctaTitle')} text={t('website.home.ctaText')} />
    </>
  )
}
