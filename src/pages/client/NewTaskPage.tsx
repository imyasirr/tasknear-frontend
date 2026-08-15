import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { PriceQuote, type Quote } from '../../components/PriceQuote'
import { useI18n } from '../../i18n/LocaleContext'
import { categoryLabel, type CategoryRow } from '../../lib/categories'
import { Loader, PageHeader, rupee } from '../../ui'

type City = { id: number; name: string }

export function NewTaskPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [pickup, setPickup] = useState('')
  const [drop, setDrop] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [workers, setWorkers] = useState(2)
  const [rate, setRate] = useState(500)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([api<CategoryRow[]>('/categories?for=task'), api<City[]>('/cities')])
      .then(([rows, cityRows]) => {
        setCategories(rows)
        setCities(cityRows)
        if (cityRows[0]) setCity(cityRows[0].name)
        if (rows[0]) {
          setCategoryId(rows[0].id)
          setRate(rows[0].default_rate_inr)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true))
  }, [])

  const selected = categories.find((c) => c.id === categoryId)
  const labor = rate * workers

  useEffect(() => {
    api<Quote>(`/pricing/quote?labor_inr=${labor}`).then(setQuote).catch(() => setQuote(null))
  }, [labor])

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title={t('client.newTask')} subtitle={t('client.newTaskSub')} />
      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>{t('client.taskTitle')}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('client.taskTitlePh')} />
          </div>
          <div className="field">
            <label>{t('settings.city')}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('client.taskPickup')}</label>
            <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder={t('client.taskPickupPh')} />
          </div>
          <div className="field">
            <label>{t('client.taskDrop')}</label>
            <input value={drop} onChange={(e) => setDrop(e.target.value)} placeholder={t('client.taskDropPh')} />
          </div>
          <div className="field">
            <label>{t('client.taskStart')}</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('client.taskEnd')}</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <h2 style={{ margin: '8px 0 6px' }}>{t('client.taskKind')}</h2>
        <p style={{ marginBottom: 12 }}>{t('client.taskKindSub')}</p>
        <div className="grid two">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`card pick-card${categoryId === c.id ? ' on' : ''}`}
              onClick={() => {
                setCategoryId(c.id)
                setRate(c.default_rate_inr)
              }}
            >
              <strong>{categoryLabel(c, locale)}</strong>
              <div className="meta" style={{ marginTop: 8 }}>
                <span>{t('client.suggested', { amount: rupee(c.default_rate_inr) })}</span>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="field">
              <label>{t('client.headcount')}</label>
              <input type="number" min={1} value={workers} onChange={(e) => setWorkers(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>
                {t('client.yourRate')} · {t('client.suggested', { amount: rupee(selected.default_rate_inr) })}
              </label>
              <input type="number" min={100} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
          </div>
        )}

        <PriceQuote quote={quote} />
        {error && <p className="err">{error}</p>}
        <button
          className="accent"
          disabled={busy}
          onClick={async () => {
            if (!categoryId) {
              setError(t('client.taskNeedCategory'))
              return
            }
            setBusy(true)
            setError('')
            try {
              const created = await api<{ id: number; slug?: string }>('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                  title,
                  city,
                  category_id: categoryId,
                  pickup_address: pickup,
                  drop_address: drop,
                  scheduled_start: start,
                  scheduled_end: end,
                  required_workers: workers,
                  rate_per_worker_inr: rate,
                }),
              })
              navigate(`/app/tasks/${created.slug || created.id}`)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not create task')
            } finally {
              setBusy(false)
            }
          }}
        >
          {t('client.createTask')}
        </button>
      </div>
    </div>
  )
}
