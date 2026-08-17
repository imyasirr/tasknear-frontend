import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { PriceQuote, type Quote } from '../../components/PriceQuote'
import { useI18n } from '../../i18n/LocaleContext'
import { categoryLabel, type CategoryRow } from '../../lib/categories'
import { providerDescription, providerLabel, type ProviderTypeRow } from '../../lib/providerTypes'
import { Loader, PageHeader, rupee } from '../../ui'

type City = { id: number; name: string }
type Step = 'provider' | 'category' | 'details'
type JobFormat = 'event' | 'task' | 'mixed'

const STEPS: Step[] = ['provider', 'category', 'details']

const PROVIDER_ICONS: Record<string, string> = {
  caterer: '🍽',
  agency: '👥',
  worker: '🛠',
  driver: '🚗',
  home_pro: '🏠',
}

function providerIcon(slug: string): string {
  return PROVIDER_ICONS[slug] || '✦'
}

function inferFormat(cats: CategoryRow[]): JobFormat | null {
  if (cats.length === 0) return null
  const hasEvent = cats.some((c) => c.vertical === 'event' || c.vertical === 'both')
  const hasTask = cats.some((c) => c.vertical === 'task')
  if (hasEvent && hasTask) return 'mixed'
  if (hasEvent) return 'event'
  if (hasTask) return 'task'
  return null
}

function categoryFormatBadge(c: CategoryRow, t: (key: string) => string): string {
  if (c.vertical === 'event') return t('client.postForEvent')
  if (c.vertical === 'task') return t('client.postForTask')
  return t('client.postForBoth')
}

function SelectionBar({
  chips,
  onBack,
  backLabel,
}: {
  chips: ReactNode
  onBack: () => void
  backLabel: string
}) {
  return (
    <div className="post-selection-bar">
      <div className="post-chips">{chips}</div>
      <button type="button" className="post-back" onClick={onBack}>
        ← {backLabel}
      </button>
    </div>
  )
}

export function PostJobPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('provider')
  const [providers, setProviders] = useState<ProviderTypeRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [providerType, setProviderType] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [format, setFormat] = useState<JobFormat | null>(null)
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [venue, setVenue] = useState('')
  const [pickup, setPickup] = useState('')
  const [drop, setDrop] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [roleCounts, setRoleCounts] = useState<Record<number, number>>({})
  const [roleRates, setRoleRates] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      api<ProviderTypeRow[]>('/provider-types'),
      api<CategoryRow[]>('/categories'),
      api<City[]>('/cities'),
    ])
      .then(([providerRows, categoryRows, cityRows]) => {
        const active = providerRows.filter((p) => p.active)
        setProviders(active)
        setCategories(categoryRows)
        setCities(cityRows)
        if (cityRows[0]) setCity(cityRows[0].name)
        if (active[0]) setProviderType(active[0].slug)
        const rates: Record<number, number> = {}
        categoryRows.forEach((c) => { rates[c.id] = c.default_rate_inr })
        setRoleRates(rates)
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true))
  }, [])

  const selectedProvider = providers.find((p) => p.slug === providerType)
  const selectedCategories = useMemo(
    () => categories.filter((c) => selectedCategoryIds.includes(c.id)),
    [categories, selectedCategoryIds],
  )
  const activeFormat = format || inferFormat(selectedCategories)
  const stepIndex = STEPS.indexOf(step)

  const providerGroups = useMemo(() => {
    const slugs = selectedProvider?.category_slugs || []
    const pool = slugs.length > 0
      ? categories.filter((c) => c.slug && slugs.includes(c.slug))
      : categories

    const eventItems = pool.filter((c) => c.vertical === 'event' || c.vertical === 'both')
    const taskItems = pool.filter((c) => c.vertical === 'task')
    const homeItems = pool.filter((c) => ['electrician', 'plumber', 'driver', 'delivery-helper'].includes(c.slug || ''))

    const groups = [
      { id: 'event', titleKey: 'client.postEventRoles', items: eventItems },
      { id: 'home', titleKey: 'client.postHomeRoles', items: homeItems },
      { id: 'task', titleKey: 'client.postTaskRoles', items: taskItems.filter((c) => !homeItems.some((h) => h.id === c.id)) },
    ]

    return groups.filter((g) => g.items.length > 0)
  }, [categories, selectedProvider])

  const labor = useMemo(
    () => selectedCategories.reduce((sum, c) => {
      const n = roleCounts[c.id] || 0
      const r = roleRates[c.id] || c.default_rate_inr
      return sum + n * r
    }, 0),
    [selectedCategories, roleCounts, roleRates],
  )

  useEffect(() => {
    if (step !== 'details' || labor <= 0) {
      setQuote(null)
      return
    }
    api<Quote>(`/pricing/quote?labor_inr=${labor}`).then(setQuote).catch(() => setQuote(null))
  }, [labor, step])

  function goToStep(target: Step) {
    if (STEPS.indexOf(target) <= stepIndex) setStep(target)
  }

  function selectProvider(slug: string) {
    if (slug !== providerType) {
      setProviderType(slug)
      setSelectedCategoryIds([])
      setRoleCounts({})
      setFormat(null)
    }
  }

  function toggleCategory(c: CategoryRow) {
    setSelectedCategoryIds((prev) => {
      const on = prev.includes(c.id)
      if (on) return prev.filter((id) => id !== c.id)
      return [...prev, c.id]
    })
  }

  function continueToDetails() {
    if (selectedCategoryIds.length === 0) {
      setError(t('client.postNeedCategory'))
      return
    }
    setError('')
    const counts = { ...roleCounts }
    const rates = { ...roleRates }
    for (const id of selectedCategoryIds) {
      const c = categories.find((x) => x.id === id)
      if (!c) continue
      if (!counts[id]) {
        counts[id] = (c.vertical === 'event' || c.vertical === 'both') ? 2 : 1
      }
      if (!rates[id]) rates[id] = c.default_rate_inr
    }
    setRoleCounts(counts)
    setRoleRates(rates)
    setFormat(inferFormat(selectedCategories))
    setStep('details')
  }

  async function submit() {
    if (!providerType || selectedCategoryIds.length === 0 || !activeFormat) {
      setError(t('client.postNeedSelection'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const eventRoles = selectedCategories.filter((c) => c.vertical === 'event' || c.vertical === 'both')
      const taskRoles = selectedCategories.filter((c) => c.vertical === 'task')
      let redirect = '/app'

      if (eventRoles.length > 0) {
        const shifts = eventRoles
          .filter((c) => (roleCounts[c.id] || 0) > 0)
          .map((c) => ({
            category_id: c.id,
            headcount: roleCounts[c.id] || 1,
            rate_per_worker_inr: roleRates[c.id] || c.default_rate_inr,
          }))

        if (shifts.length === 0) {
          setError(t('client.postNeedHeadcount'))
          setBusy(false)
          return
        }

        const created = await api<{ id: number; slug?: string }>('/events', {
          method: 'POST',
          body: JSON.stringify({
            title,
            city,
            venue_name: venue,
            provider_type: providerType,
            scheduled_start: start,
            scheduled_end: end,
            shifts,
          }),
        })
        redirect = `/app/events/${created.slug || created.id}`
      }

      const taskPosts = taskRoles.filter((c) => (roleCounts[c.id] || 0) > 0)
      if (taskRoles.length > 0 && taskPosts.length === 0 && eventRoles.length === 0) {
        setError(t('client.postNeedHeadcount'))
        setBusy(false)
        return
      }

      for (const c of taskPosts) {
        const workers = roleCounts[c.id] || 1
        const created = await api<{ id: number; slug?: string }>('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: taskPosts.length > 1 ? `${title} — ${categoryLabel(c, locale)}` : title,
            city,
            category_id: c.id,
            provider_type: providerType,
            pickup_address: pickup,
            drop_address: drop,
            scheduled_start: start,
            scheduled_end: end,
            required_workers: workers,
            rate_per_worker_inr: roleRates[c.id] || c.default_rate_inr,
          }),
        })
        if (eventRoles.length === 0) redirect = `/app/tasks/${created.slug || created.id}`
      }

      if (taskPosts.length > 0 && eventRoles.length > 0) {
        redirect = '/app'
      }

      navigate(redirect)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('client.postFail'))
    } finally {
      setBusy(false)
    }
  }

  function renderProviderGroup(group: { id: string; titleKey: string; items: CategoryRow[] }) {
    return (
      <section className="post-section" key={group.id}>
        <div className="post-section-head">
          <h3>{t(group.titleKey)}</h3>
          <span className="post-section-count">{group.items.length}</span>
        </div>
        <div className="post-cat-grid">
          {group.items.map((c) => {
            const selected = selectedCategoryIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                className={`card pick-card post-cat-pick${selected ? ' on' : ''}`}
                onClick={() => toggleCategory(c)}
                aria-pressed={selected}
              >
                <div className="post-cat-copy">
                  <strong>{categoryLabel(c, locale)}</strong>
                  <span className="post-cat-badge">{categoryFormatBadge(c, t)}</span>
                </div>
                <div className="post-cat-meta">
                  <span>{t('client.suggested', { amount: rupee(c.default_rate_inr) })}</span>
                  {selected && <span className="post-cat-check">✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  if (!ready) return <Loader />

  const showVenue = activeFormat === 'event' || activeFormat === 'mixed'
  const showPickup = activeFormat === 'task' || activeFormat === 'mixed'
  const showCrewGrid = selectedCategories.length > 0

  return (
    <div className="page post-wizard">
      <PageHeader title={t('client.postJob')} subtitle={t('client.postJobSub')} />

      <ol className="post-stepper" aria-label={t('client.postJob')}>
        {STEPS.map((s, i) => {
          const done = stepIndex > i
          const on = step === s
          const canJump = done
          const inner = (
            <>
              <span className="post-stepper-dot">{done ? '✓' : i + 1}</span>
              <span className="post-stepper-label">{t(`client.postStep.${s}`)}</span>
            </>
          )
          return (
            <li key={s} className={`post-stepper-item${on ? ' on' : ''}${done ? ' done' : ''}`}>
              {canJump ? (
                <button type="button" className="post-stepper-btn" onClick={() => goToStep(s)}>
                  {inner}
                </button>
              ) : inner}
            </li>
          )
        })}
      </ol>

      {step === 'provider' && (
        <section className="card post-panel post-panel-fill">
          <div className="post-panel-head">
            <div>
              <div className="card-kicker">{t('client.postProviderTitle')}</div>
              <p className="post-lead">{t('client.postProviderSubAll')}</p>
            </div>
            <span className="post-step-pill">{t('client.postStepOf', { n: 1 })}</span>
          </div>

          <div className="post-provider-grid">
            {providers.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={`card pick-card post-pick${providerType === p.slug ? ' on' : ''}`}
                disabled={!p.active}
                onClick={() => selectProvider(p.slug)}
              >
                <span className="post-pick-icon" aria-hidden>{providerIcon(p.slug)}</span>
                <div className="post-pick-body">
                  <strong>{providerLabel(p, locale)}</strong>
                  <p>{providerDescription(p, locale)}</p>
                  {p.coming_soon && <span className="pill soon">{t('client.comingSoon')}</span>}
                </div>
              </button>
            ))}
          </div>

          <div className="post-nav">
            <button
              type="button"
              className="accent"
              disabled={!providerType}
              onClick={() => setStep('category')}
            >
              {t('client.postContinue')}
            </button>
          </div>
        </section>
      )}

      {step === 'category' && (
        <section className="card post-panel post-panel-fill">
          <div className="post-panel-head">
            <div>
              <div className="card-kicker">{t('client.postCategoryTitle')}</div>
              <p className="post-lead">{t('client.postCategorySubMulti')}</p>
            </div>
            <span className="post-step-pill">{t('client.postStepOf', { n: 2 })}</span>
          </div>

          {selectedProvider && (
            <SelectionBar
              onBack={() => setStep('provider')}
              backLabel={t('client.postBackProvider')}
              chips={(
                <span className="post-chip">
                  {providerIcon(selectedProvider.slug)} {providerLabel(selectedProvider, locale)}
                </span>
              )}
            />
          )}

          {selectedCategoryIds.length > 0 && (
            <div className="post-chips post-chips-selected">
              {selectedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="post-chip post-chip-toggle"
                  onClick={() => toggleCategory(c)}
                >
                  {categoryLabel(c, locale)} ×
                </button>
              ))}
            </div>
          )}

          <div className="post-category-stack">
            {providerGroups.map((g) => renderProviderGroup(g))}
          </div>

          {error && <p className="err">{error}</p>}

          <div className="post-nav">
            <button
              type="button"
              className="accent"
              disabled={selectedCategoryIds.length === 0}
              onClick={continueToDetails}
            >
              {selectedCategoryIds.length > 0
                ? t('client.postContinueSelected', { n: selectedCategoryIds.length })
                : t('client.postContinue')}
            </button>
          </div>
        </section>
      )}

      {step === 'details' && selectedCategories.length > 0 && (
        <div className="split even post-details-layout post-panel-fill">
          <section className="card post-panel post-form-main">
            <div className="post-panel-head">
              <div>
                <div className="card-kicker">{t('client.postDetailsTitle')}</div>
                <p className="post-lead">{t('client.postDetailsSub')}</p>
              </div>
              <span className="post-step-pill">{t('client.postStepOf', { n: 3 })}</span>
            </div>

            <SelectionBar
              onBack={() => setStep('category')}
              backLabel={t('client.postBackCategory')}
              chips={(
                <>
                  {selectedProvider && (
                    <span className="post-chip">
                      {providerIcon(selectedProvider.slug)} {providerLabel(selectedProvider, locale)}
                    </span>
                  )}
                  {selectedCategories.map((c) => (
                    <span key={c.id} className="post-chip">{categoryLabel(c, locale)}</span>
                  ))}
                </>
              )}
            />

            {activeFormat === 'mixed' && (
              <div className="alert warn post-mixed-note">{t('client.postMixedNote')}</div>
            )}

            <div className="post-form-block">
              <h3 className="post-form-title">{t('client.postWhenWhere')}</h3>
              <div className="form-grid">
                <div className="field span-2">
                  <label>{showVenue && !showPickup ? t('client.eventTitle') : t('client.taskTitle')}</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('client.taskTitlePh')} />
                </div>
                <div className="field">
                  <label>{t('settings.city')}</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)}>
                    {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                {showVenue && (
                  <div className="field">
                    <label>{t('client.venue')}</label>
                    <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={t('client.venuePh')} />
                  </div>
                )}
                {showPickup && (
                  <>
                    <div className="field">
                      <label>{t('client.taskPickup')}</label>
                      <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder={t('client.taskPickupPh')} />
                    </div>
                    <div className="field">
                      <label>{t('client.taskDrop')}</label>
                      <input value={drop} onChange={(e) => setDrop(e.target.value)} placeholder={t('client.taskDropPh')} />
                    </div>
                  </>
                )}
                <div className="field">
                  <label>{t('client.taskStart')}</label>
                  <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div className="field">
                  <label>{t('client.taskEnd')}</label>
                  <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>
            </div>

            {showCrewGrid && (
              <div className="post-form-block">
                <h3 className="post-form-title">{t('client.postCrewPay')}</h3>
                <div className="post-crew-grid">
                  {selectedCategories.map((c) => (
                    <div className="card post-crew-card" key={c.id}>
                      <strong>{categoryLabel(c, locale)}</strong>
                      <span className="post-cat-badge">{categoryFormatBadge(c, t)}</span>
                      <div className="form-grid post-crew-fields">
                        <div className="field">
                          <label>{t('client.headcount')}</label>
                          <input
                            type="number"
                            min={0}
                            value={roleCounts[c.id] || 0}
                            onChange={(e) => setRoleCounts({ ...roleCounts, [c.id]: Number(e.target.value) })}
                          />
                        </div>
                        <div className="field">
                          <label>{t('client.yourRate')}</label>
                          <input
                            type="number"
                            min={100}
                            value={roleRates[c.id] || c.default_rate_inr}
                            onChange={(e) => setRoleRates({ ...roleRates, [c.id]: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="err">{error}</p>}
          </section>

          <aside className="side-panel post-side">
            <div className="card post-summary-card">
              <div className="card-kicker">{t('client.postSummaryTitle')}</div>
              <div className="post-summary-rows">
                <div className="post-summary-row">
                  <span>{t('client.postStep.provider')}</span>
                  <strong>{selectedProvider ? providerLabel(selectedProvider, locale) : '—'}</strong>
                </div>
                <div className="post-summary-row">
                  <span>{t('client.postStep.category')}</span>
                  <strong>{selectedCategories.map((c) => categoryLabel(c, locale)).join(', ')}</strong>
                </div>
                <div className="post-summary-row">
                  <span>{t('settings.city')}</span>
                  <strong>{city || '—'}</strong>
                </div>
                {labor > 0 && (
                  <div className="post-summary-row">
                    <span>{t('pay.crew')}</span>
                    <strong>{rupee(labor)}</strong>
                  </div>
                )}
              </div>
            </div>

            <PriceQuote quote={quote} />

            <div className="post-submit-bar">
              <button className="accent" disabled={busy || !activeFormat || !title.trim()} onClick={() => void submit()}>
                {busy ? t('common.saving') : t('client.postSubmit')}
              </button>
              <p className="post-submit-hint">{t('client.postSubmitHint')}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
