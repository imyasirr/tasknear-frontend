import { useI18n } from '../i18n/LocaleContext'

export type VendorCompany = {
  id?: number
  name?: string
  phone?: string
  city?: string
} | null

export type VendorRing = {
  ringing?: boolean
  count?: number
  accepted?: boolean
} | null

export function VendorStatus({
  company,
  ring,
}: {
  company?: VendorCompany
  ring?: VendorRing
}) {
  const { t } = useI18n()

  if (company?.name) {
    return (
      <div className="card vendor-card">
        <div className="card-kicker">{t('nav.caterer')}</div>
        <strong>{company.name}</strong>
        <div className="meta">
          {company.phone && <span><a href={`tel:${company.phone}`}>{company.phone}</a></span>}
          {company.city && <span>{company.city}</span>}
        </div>
        <p style={{ marginTop: 8 }}>{t('client.vendorCovering')}</p>
      </div>
    )
  }

  if (ring?.ringing) {
    return (
      <div className="card vendor-card">
        <div className="card-kicker">{t('nav.caterer')}</div>
        <p>{t('client.vendorRinging', { n: ring.count || 0 })}</p>
      </div>
    )
  }

  return null
}
