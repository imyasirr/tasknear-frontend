import { PublicHero, PublicImage, PublicProse } from './PublicPage'
import { useI18n } from '../../i18n/LocaleContext'
import { publicImages } from './media'

export function AboutPage() {
  const { t } = useI18n()

  return (
    <>
      <PublicHero
        compact
        kicker={t('website.about.kicker')}
        title={t('website.about.title')}
        lead={t('website.about.lead')}
        aside={(
          <PublicImage
            src={publicImages.aboutTeam}
            alt={t('website.about.imgTeam')}
            className="public-hero-img"
          />
        )}
      />
      <PublicProse title={t('website.about.bodyTitle')}>
        <div className="public-about-gallery">
          <PublicImage
            src={publicImages.homeHero}
            alt={t('website.about.imgWork')}
            className="public-about-shot"
          />
          <PublicImage
            src={publicImages.homeProviders}
            alt={t('website.about.imgCrew')}
            className="public-about-shot"
          />
        </div>
        <p>{t('website.about.p1')}</p>
        <p>{t('website.about.p2')}</p>
        <h2>{t('website.about.missionTitle')}</h2>
        <p>{t('website.about.missionText')}</p>
        <h2>{t('website.about.pilotTitle')}</h2>
        <p>{t('website.about.pilotText')}</p>
      </PublicProse>
    </>
  )
}
