import { useState, type FormEvent } from 'react'
import { PublicHero, PublicImage } from './PublicPage'
import { useI18n } from '../../i18n/LocaleContext'
import { publicImages } from './media'

export function ContactPage() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <PublicHero
        compact
        kicker={t('website.contact.kicker')}
        title={t('website.contact.title')}
        lead={t('website.contact.lead')}
        aside={(
          <PublicImage
            src={publicImages.contactSupport}
            alt={t('website.contact.imgSupport')}
            className="public-hero-img"
          />
        )}
      />
      <section className="public-section public-contact-section">
        <div className="public-container public-contact-grid">
          <div className="public-contact-side">
            <PublicImage
              src={publicImages.homeClients}
              alt={t('website.contact.imgHelp')}
              className="public-contact-banner"
            />
            <div className="public-contact-info">
              <h2>{t('website.contact.infoTitle')}</h2>
              <div className="kv">
                <div className="kv-row"><span>{t('website.contact.email')}</span><strong>hello@tasknear.in</strong></div>
                <div className="kv-row"><span>{t('website.contact.phone')}</span><strong>+91 90000 00001</strong></div>
                <div className="kv-row"><span>{t('website.contact.city')}</span><strong>Lucknow, Uttar Pradesh</strong></div>
                <div className="kv-row"><span>{t('website.contact.hours')}</span><strong>{t('website.contact.hoursVal')}</strong></div>
              </div>
              <p className="public-meta">{t('website.contact.note')}</p>
            </div>
          </div>

          <form className="public-contact-form" onSubmit={submit}>
            <h2>{t('website.contact.formTitle')}</h2>
            {sent ? (
              <div className="alert ok">{t('website.contact.sent')}</div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="contact-name">{t('website.contact.name')}</label>
                  <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="contact-email">{t('website.contact.emailLabel')}</label>
                  <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="contact-phone">{t('website.contact.phoneLabel')}</label>
                  <input id="contact-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="contact-message">{t('website.contact.message')}</label>
                  <textarea id="contact-message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <button type="submit" className="accent public-btn block">{t('website.contact.submit')}</button>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  )
}
