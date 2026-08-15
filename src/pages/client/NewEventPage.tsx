import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { PriceQuote, type Quote } from '../../components/PriceQuote'
import { useI18n } from '../../i18n/LocaleContext'
import { categoryLabel, type CategoryRow } from '../../lib/categories'
import { Loader, PageHeader, rupee } from '../../ui'
type City = { id: number; name: string; state?: string }

export function NewEventPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [title, setTitle] = useState('Saturday wedding')
  const [city, setCity] = useState('Lucknow')
  const [venue, setVenue] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [rates, setRates] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([api<CategoryRow[]>('/categories?for=event'), api<City[]>('/cities')])
      .then(([cats, cityRows]) => {
        setCategories(cats)
        setCities(cityRows)
        if (cityRows[0]) setCity(cityRows[0].name)
        const next: Record<number, number> = {}
        cats.forEach((c) => { next[c.id] = c.default_rate_inr })
        setRates(next)
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true))
  }, [])

  const estimate = categories.reduce((sum, c) => sum + (counts[c.id] || 0) * (rates[c.id] || c.default_rate_inr), 0)

  useEffect(() => {
    api<Quote>(`/pricing/quote?labor_inr=${estimate}`).then(setQuote).catch(() => setQuote(null))
  }, [estimate])

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title={t('client.newEvent')} subtitle={t('client.newEventSub')} />
      <div className="card">
        <div className="form-grid">
          <div className="field"><label>Event title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field">
            <label>{t('settings.city')}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Venue</label><input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Banquet / lawn / hotel" /></div>
          <div className="field"><label>Start</label><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="field"><label>End</label><input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <h2 style={{ margin: '8px 0 12px' }}>{t('client.headcount')}</h2>
        <p style={{ marginBottom: 12 }}>{t('client.yourRate')}</p>
        <div className="grid two">
          {categories.map((c) => (
            <div className="card" key={c.id} style={{ padding: 14 }}>
              <strong>{categoryLabel(c, locale)}</strong>
              <div className="field" style={{ marginTop: 10 }}>
                <label>{t('client.headcount')}</label>
                <input type="number" min={0} value={counts[c.id] || 0} onChange={(e) => setCounts({ ...counts, [c.id]: Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>{t('client.yourRate')} · {t('client.suggested', { amount: rupee(c.default_rate_inr) })}</label>
                <input type="number" min={100} value={rates[c.id] || c.default_rate_inr} onChange={(e) => setRates({ ...rates, [c.id]: Number(e.target.value) })} />
              </div>
            </div>
          ))}
        </div>
        <PriceQuote quote={quote} />
        {error && <p className="err">{error}</p>}
        <button
          className="accent"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError('')
            const shifts = Object.entries(counts).filter(([, n]) => n > 0).map(([id, headcount]) => ({
              category_id: Number(id),
              headcount,
              rate_per_worker_inr: rates[Number(id)] || undefined,
            }))
            try {
              const created = await api<{ id: number; slug?: string }>('/events', {
                method: 'POST',
                body: JSON.stringify({ title, city, venue_name: venue, scheduled_start: start, scheduled_end: end, shifts }),
              })
              navigate(`/app/events/${created.slug || created.id}`)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not create event')
            } finally {
              setBusy(false)
            }
          }}
        >
          {t('client.createAssign')}
        </button>
      </div>
    </div>
  )
}
