import { PublicHero, PublicProse } from './PublicPage'
import { useI18n } from '../../i18n/LocaleContext'

export function PrivacyPage() {
  const { t } = useI18n()

  const sections = [
    { title: t('website.privacy.s1Title'), text: t('website.privacy.s1Text') },
    { title: t('website.privacy.s2Title'), text: t('website.privacy.s2Text') },
    { title: t('website.privacy.s3Title'), text: t('website.privacy.s3Text') },
    { title: t('website.privacy.s4Title'), text: t('website.privacy.s4Text') },
    { title: t('website.privacy.s5Title'), text: t('website.privacy.s5Text') },
  ]

  return (
    <>
      <PublicHero compact title={t('website.privacy.title')} lead={t('website.privacy.intro')} />
      <PublicProse title={t('website.privacy.title')} hideTitle>
        <p className="public-meta">{t('website.privacy.updated')}</p>
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
      </PublicProse>
    </>
  )
}
