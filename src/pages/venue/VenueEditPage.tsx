import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, apiForm } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge, rupee } from '../../ui'

type AmenityField = { type: 'count' | 'bool'; en: string; hi: string }
type Meta = { amenity_fields: Record<string, AmenityField>; venue_types: Record<string, { en: string; hi: string }> }
type Photo = { id: number; url: string }
type Venue = {
  id: number
  name: string
  venue_type: string
  description?: string
  address?: string
  city?: string
  capacity_min: number
  capacity_max: number
  advance_percent: number
  price_per_day_inr: number
  amenities?: Record<string, number | boolean>
  status: string
  photos?: Photo[]
}

const DEFAULT_AMENITIES: Record<string, number | boolean> = {
  halls: 0,
  rooms: 0,
  bathrooms: 0,
  parking_cars: 0,
  parking_bikes: 0,
  ac: false,
  stage: false,
  kitchen: false,
  garden: false,
  wifi: false,
  generator: false,
  valet: false,
}

export function VenueEditPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const [meta, setMeta] = useState<Meta | null>(null)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [name, setName] = useState('')
  const [venueType, setVenueType] = useState('banquet')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [capMin, setCapMin] = useState(50)
  const [capMax, setCapMax] = useState(500)
  const [advance, setAdvance] = useState(30)
  const [pricePerDay, setPricePerDay] = useState(25000)
  const [amenities, setAmenities] = useState<Record<string, number | boolean>>({ ...DEFAULT_AMENITIES })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      api<Meta>('/venues/meta'),
      isNew ? Promise.resolve(null) : api<Venue>(`/venue-partner/venues/${id}`),
    ]).then(([m, v]) => {
      setMeta(m)
      if (v) {
        setVenue(v)
        setName(v.name)
        setVenueType(v.venue_type)
        setDescription(v.description || '')
        setAddress(v.address || '')
        setCity(v.city || 'Lucknow')
        setCapMin(v.capacity_min)
        setCapMax(v.capacity_max)
        setAdvance(v.advance_percent)
        setPricePerDay(v.price_per_day_inr || 25000)
        setAmenities({ ...DEFAULT_AMENITIES, ...(v.amenities || {}) })
      }
    }).catch((e) => setError(e instanceof Error ? e.message : t('common.error')))
      .finally(() => setReady(true))
  }, [id, isNew, t])

  async function save() {
    setBusy(true)
    setError('')
    setMsg('')
    try {
      const body = {
        name,
        venue_type: venueType,
        description,
        address,
        city,
        capacity_min: capMin,
        capacity_max: capMax,
        advance_percent: advance,
        price_per_day_inr: pricePerDay,
        amenities,
      }
      if (isNew) {
        const created = await api<Venue>('/venue-partner/venues', { method: 'POST', body: JSON.stringify(body) })
        navigate(`/venue/listings/${created.id}`, { replace: true })
      } else if (venue) {
        const updated = await api<Venue>(`/venue-partner/venues/${venue.id}`, { method: 'PUT', body: JSON.stringify(body) })
        setVenue(updated)
        setMsg(t('settings.saved'))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function uploadPhoto(file: File) {
    if (!venue) return
    setError('')
    try {
      const form = new FormData()
      form.append('photo', file)
      const photo = await apiForm<Photo>(`/venue-partner/venues/${venue.id}/photos`, form)
      setVenue((v) => (v ? { ...v, photos: [...(v.photos || []), photo] } : v))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    }
  }

  async function publish() {
    if (!venue) return
    setBusy(true)
    setError('')
    try {
      const updated = await api<Venue>(`/venue-partner/venues/${venue.id}/publish`, { method: 'POST' })
      setVenue(updated)
      setMsg(t('venue.published'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const labelFor = (key: string) => {
    const row = meta?.amenity_fields?.[key]
    if (!row) return key
    return locale === 'hi' && row.hi ? row.hi : row.en
  }

  if (!ready) return <Loader label={t('common.loading')} />

  const countKeys = Object.entries(meta?.amenity_fields || {}).filter(([, v]) => v.type === 'count')
  const boolKeys = Object.entries(meta?.amenity_fields || {}).filter(([, v]) => v.type === 'bool')

  return (
    <div className="page venue-page">
      <PageHeader
        title={isNew ? t('venue.newListing') : name || t('venue.editListing')}
        subtitle={t('venue.editSub')}
        actions={venue ? <StatusBadge value={venue.status} /> : undefined}
      />
      {error && <p className="err">{error}</p>}
      {msg && <div className="alert ok">{msg}</div>}

      <div className="venue-edit-grid">
        <div className="card venue-card">
          <div className="card-kicker">{t('venue.basics')}</div>
          <div className="form-grid">
            <div className="field"><label>{t('venue.name')}</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field">
              <label>{t('venue.typeLabel')}</label>
              <select value={venueType} onChange={(e) => setVenueType(e.target.value)}>
                <option value="lawn">{t('venue.type.lawn')}</option>
                <option value="banquet">{t('venue.type.banquet')}</option>
                <option value="both">{t('venue.type.both')}</option>
              </select>
            </div>
            <div className="field"><label>{t('settings.city')}</label><input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="field"><label>{t('venue.address')}</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="field"><label>{t('venue.capacityMin')}</label><input type="number" value={capMin} onChange={(e) => setCapMin(+e.target.value)} /></div>
            <div className="field"><label>{t('venue.capacityMax')}</label><input type="number" value={capMax} onChange={(e) => setCapMax(+e.target.value)} /></div>
            <div className="field"><label>{t('venue.pricePerDay')}</label><input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(+e.target.value)} /></div>
            <div className="field"><label>{t('venue.advancePercent')}</label><input type="number" value={advance} onChange={(e) => setAdvance(+e.target.value)} /></div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>{t('venue.description')}</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="card venue-card">
          <div className="card-kicker">{t('venue.amenities')}</div>
          <p className="meta" style={{ marginBottom: 12 }}>{t('venue.amenitiesHint')}</p>
          <div className="form-grid">
            {countKeys.map(([key]) => (
              <div className="field" key={key}>
                <label>{labelFor(key)}</label>
                <input
                  type="number"
                  min={0}
                  value={Number(amenities[key] || 0)}
                  onChange={(e) => setAmenities((a) => ({ ...a, [key]: +e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="venue-bool-grid" style={{ marginTop: 14 }}>
            {boolKeys.map(([key]) => (
              <label key={key} className={`venue-check${amenities[key] ? ' on' : ''}`}>
                <input
                  type="checkbox"
                  checked={Boolean(amenities[key])}
                  onChange={(e) => setAmenities((a) => ({ ...a, [key]: e.target.checked }))}
                />
                {labelFor(key)}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-row" style={{ margin: '16px 0' }}>
        <button className="accent" disabled={busy || !name} onClick={() => void save()}>{t('common.save')}</button>
        {venue && venue.status !== 'published' && (
          <button disabled={busy} onClick={() => void publish()}>{t('venue.publish')}</button>
        )}
      </div>

      {venue && (
        <div className="card venue-card">
          <div className="card-kicker">{t('venue.gallery')}</div>
          <p className="meta" style={{ marginBottom: 12 }}>{t('venue.galleryHint')}</p>
          <div className="venue-gallery">
            {(venue.photos || []).map((p) => (
              <img key={p.id} src={p.url} alt="" className="venue-gallery-img" />
            ))}
            {(venue.photos || []).length === 0 && <p className="empty">{t('venue.noPhotos')}</p>}
          </div>
          <label className="venue-upload">
            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); e.target.value = '' }} />
            {t('venue.addPhoto')}
          </label>
          <p className="meta" style={{ marginTop: 8 }}>{t('venue.pricePreview', { amount: rupee(pricePerDay) })}</p>
        </div>
      )}
    </div>
  )
}
