import { PublicHero, PublicProse } from './PublicPage'
import { useI18n } from '../../i18n/LocaleContext'

export function TermsPage() {
  const { t } = useI18n()

  const sections = [
    { title: t('website.terms.s1Title'), text: t('website.terms.s1Text') },
    { title: t('website.terms.s2Title'), text: t('website.terms.s2Text') },
    { title: t('website.terms.s3Title'), text: t('website.terms.s3Text') },
    { title: t('website.terms.s4Title'), text: t('website.terms.s4Text') },
    { title: t('website.terms.s5Title'), text: t('website.terms.s5Text') },
  ]

  return (
    <>
      <PublicHero compact title={t('website.terms.title')} lead={t('website.terms.intro')} />
      <PublicProse title={t('website.terms.title')} hideTitle>
        <p className="public-meta">{t('website.terms.updated')}</p>
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
