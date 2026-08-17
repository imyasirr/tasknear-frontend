import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { categoryLabel, type CategoryRow } from '../../lib/categories'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'
import { AdminAlert, AdminDetailStack, AdminFormCard, AdminPage, AdminTab, AdminTableCard, AdminTabs, AdminWorkspace } from './admin-ui'

type ProviderTypeRow = {
  id: number
  slug: string
  role: string
  match_mode: 'vendor' | 'worker'
  name: string
  name_hi?: string
  description?: string
  description_hi?: string
  category_slugs?: string[]
  is_active: boolean
  sort_order: number
}

type Tab = 'providers' | 'skills'

type ProviderForm = {
  slug: string
  role: string
  match_mode: 'vendor' | 'worker'
  name: string
  name_hi: string
  description: string
  sort_order: number
}

type CategoryForm = {
  slug: string
  name: string
  name_hi: string
  vertical: 'event' | 'task' | 'both'
  default_rate_inr: number
  default_duration_minutes: number
}

const EMPTY_PROVIDER: ProviderForm = {
  slug: '',
  role: '',
  match_mode: 'vendor',
  name: '',
  name_hi: '',
  description: '',
  sort_order: 99,
}

const EMPTY_CATEGORY: CategoryForm = {
  slug: '',
  name: '',
  name_hi: '',
  vertical: 'task',
  default_rate_inr: 600,
  default_duration_minutes: 180,
}

export function AdminCatalogPage() {
  const { t, locale } = useI18n()
  const [tab, setTab] = useState<Tab>('providers')
  const [providers, setProviders] = useState<ProviderTypeRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [pickedProvider, setPickedProvider] = useState<ProviderTypeRow | null>(null)
  const [pickedCategory, setPickedCategory] = useState<CategoryRow | null>(null)
  const [providerForm, setProviderForm] = useState<ProviderForm>(EMPTY_PROVIDER)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  async function load() {
    const [providerRows, categoryRows] = await Promise.all([
      api<ProviderTypeRow[]>('/admin/provider-types'),
      api<CategoryRow[]>('/admin/categories'),
    ])
    setProviders(providerRows)
    setCategories(categoryRows)
    setPickedProvider((cur) => providerRows.find((p) => p.id === cur?.id) || providerRows[0] || null)
    setPickedCategory((cur) => categoryRows.find((c) => c.id === cur?.id) || categoryRows[0] || null)
  }

  useEffect(() => {
    load().catch((e) => setError(e.message)).finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (pickedProvider) {
      setProviderForm({
        slug: pickedProvider.slug,
        role: pickedProvider.role,
        match_mode: pickedProvider.match_mode,
        name: pickedProvider.name,
        name_hi: pickedProvider.name_hi || '',
        description: pickedProvider.description || '',
        sort_order: pickedProvider.sort_order,
      })
    }
  }, [pickedProvider?.id])

  useEffect(() => {
    if (pickedCategory) {
      setCategoryForm({
        slug: pickedCategory.slug || '',
        name: pickedCategory.name,
        name_hi: pickedCategory.name_hi || '',
        vertical: (pickedCategory.vertical as CategoryForm['vertical']) || 'task',
        default_rate_inr: pickedCategory.default_rate_inr,
        default_duration_minutes: pickedCategory.default_duration_minutes || 180,
      })
    }
  }, [pickedCategory?.id])

  const providerSlugs = pickedProvider?.category_slugs || []

  const providerColumns: Column<ProviderTypeRow>[] = [
    { key: 'name', header: t('admin.catalog.provider'), sortValue: (p) => p.name, csv: (p) => p.name, render: (p) => <strong>{p.name}</strong> },
    { key: 'slug', header: t('admin.catalog.slug'), sortValue: (p) => p.slug, csv: (p) => p.slug, render: (p) => p.slug },
    { key: 'match', header: t('admin.catalog.matchMode'), sortValue: (p) => p.match_mode, csv: (p) => p.match_mode, render: (p) => p.match_mode },
    { key: 'skills', header: t('admin.catalog.linkedSkills'), sortValue: (p) => (p.category_slugs || []).length, csv: (p) => (p.category_slugs || []).join(', '), render: (p) => (p.category_slugs || []).length },
    { key: 'status', header: t('cols.status'), sortValue: (p) => p.is_active ? 'active' : 'off', csv: (p) => p.is_active ? 'active' : 'inactive', render: (p) => <StatusBadge value={p.is_active ? 'active' : 'pending'} /> },
  ]

  const categoryColumns: Column<CategoryRow>[] = [
    { key: 'name', header: t('admin.catalog.skill'), sortValue: (c) => c.name, csv: (c) => c.name, render: (c) => <strong>{categoryLabel(c, locale)}</strong> },
    { key: 'slug', header: t('admin.catalog.slug'), sortValue: (c) => c.slug || '', csv: (c) => c.slug, render: (c) => c.slug },
    { key: 'vertical', header: t('admin.catalog.vertical'), sortValue: (c) => c.vertical || '', csv: (c) => c.vertical, render: (c) => c.vertical },
    { key: 'rate', header: t('admin.catalog.rate'), sortValue: (c) => c.default_rate_inr, csv: (c) => c.default_rate_inr, render: (c) => rupee(c.default_rate_inr) },
    { key: 'status', header: t('cols.status'), sortValue: (c) => c.is_active === false ? 'off' : 'active', csv: (c) => c.is_active === false ? 'inactive' : 'active', render: (c) => <StatusBadge value={c.is_active === false ? 'pending' : 'active'} /> },
  ]

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.slug),
    [categories],
  )

  async function saveProvider(create = false) {
    setBusy(true)
    setError('')
    try {
      if (create) {
        await api('/admin/provider-types', {
          method: 'POST',
          body: JSON.stringify({
            ...providerForm,
            category_slugs: [],
            is_active: true,
          }),
        })
      } else if (pickedProvider) {
        await api(`/admin/provider-types/${pickedProvider.id}`, {
          method: 'PUT',
          body: JSON.stringify(providerForm),
        })
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.catalog.saveFail'))
    } finally {
      setBusy(false)
    }
  }

  async function toggleProviderSkills(slug: string) {
    if (!pickedProvider) return
    const next = providerSlugs.includes(slug)
      ? providerSlugs.filter((s) => s !== slug)
      : [...providerSlugs, slug]
    setBusy(true)
    try {
      await api(`/admin/provider-types/${pickedProvider.id}`, {
        method: 'PUT',
        body: JSON.stringify({ category_slugs: next }),
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.catalog.saveFail'))
    } finally {
      setBusy(false)
    }
  }

  async function saveCategory(create = false) {
    setBusy(true)
    setError('')
    try {
      if (create) {
        await api('/admin/categories', {
          method: 'POST',
          body: JSON.stringify({ ...categoryForm, is_active: true }),
        })
      } else if (pickedCategory) {
        await api(`/admin/categories/${pickedCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryForm),
        })
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.catalog.saveFail'))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <Loader />

  return (
    <AdminPage>
      <PageHeader title={t('admin.catalog.title')} subtitle={t('admin.catalog.subtitle')} />

      <AdminTabs>
        <AdminTab active={tab === 'providers'} onClick={() => setTab('providers')}>
          {t('admin.catalog.providersTab')} ({providers.length})
        </AdminTab>
        <AdminTab active={tab === 'skills'} onClick={() => setTab('skills')}>
          {t('admin.catalog.skillsTab')} ({categories.length})
        </AdminTab>
      </AdminTabs>

      <AdminAlert message={error} />

      {tab === 'providers' && (
        <AdminWorkspace
          even
          table={(
            <AdminTableCard>
              <DataTable
                rows={providers}
                columns={providerColumns}
                rowKey={(p) => p.id}
                filename="tasknear-provider-types"
                empty={t('admin.catalog.emptyProviders')}
                onSelect={setPickedProvider}
                selectedKey={pickedProvider?.id}
              />
            </AdminTableCard>
          )}
          detail={(
            <AdminDetailStack>
              <AdminFormCard
                kicker={pickedProvider ? t('admin.catalog.editProvider') : t('admin.catalog.addProvider')}
                actions={(
                  <>
                    {pickedProvider ? (
                      <>
                        <button className="accent" disabled={busy} onClick={() => void saveProvider()}>{t('common.save')}</button>
                        <button className="ghost" disabled={busy} onClick={() => void api(`/admin/provider-types/${pickedProvider.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !pickedProvider.is_active }) }).then(load)}>
                          {pickedProvider.is_active ? t('admin.catalog.turnOff') : t('admin.catalog.turnOn')}
                        </button>
                      </>
                    ) : (
                      <button className="accent" disabled={busy || !providerForm.slug || !providerForm.name} onClick={() => void saveProvider(true)}>{t('admin.catalog.addProvider')}</button>
                    )}
                    <button className="ghost" type="button" onClick={() => { setPickedProvider(null); setProviderForm(EMPTY_PROVIDER) }}>{t('admin.catalog.new')}</button>
                  </>
                )}
              >
                <div className="field">
                  <label>{t('admin.catalog.slug')}</label>
                  <input value={providerForm.slug} onChange={(e) => setProviderForm({ ...providerForm, slug: e.target.value })} disabled={!!pickedProvider} />
                </div>
                <div className="field">
                  <label>{t('admin.catalog.role')}</label>
                  <input value={providerForm.role} onChange={(e) => setProviderForm({ ...providerForm, role: e.target.value })} disabled={!!pickedProvider} />
                </div>
                <div className="field">
                  <label>{t('admin.catalog.provider')}</label>
                  <input value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t('admin.catalog.nameHi')}</label>
                  <input value={providerForm.name_hi} onChange={(e) => setProviderForm({ ...providerForm, name_hi: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t('admin.catalog.matchMode')}</label>
                  <select value={providerForm.match_mode} onChange={(e) => setProviderForm({ ...providerForm, match_mode: e.target.value as 'vendor' | 'worker' })}>
                    <option value="vendor">vendor</option>
                    <option value="worker">worker</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('admin.catalog.description')}</label>
                  <textarea rows={3} value={providerForm.description} onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })} />
                </div>
              </AdminFormCard>

              {pickedProvider && (
                <div className="card admin-detail">
                  <div className="card-kicker">{t('admin.catalog.linkedSkills')}</div>
                  <p className="admin-form-hint">{t('admin.catalog.linkedSkillsSub')}</p>
                  <div className="skill-chip-grid">
                    {categoryOptions.map((c) => {
                      const on = providerSlugs.includes(c.slug || '')
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`skill-chip pick${on ? ' on' : ''}`}
                          onClick={() => void toggleProviderSkills(c.slug || '')}
                        >
                          <span>{categoryLabel(c, locale)}</span>
                          <small>{c.vertical}</small>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </AdminDetailStack>
          )}
        />
      )}

      {tab === 'skills' && (
        <AdminWorkspace
          even
          table={(
            <AdminTableCard>
              <DataTable
                rows={categories}
                columns={categoryColumns}
                rowKey={(c) => c.id}
                filename="tasknear-categories"
                empty={t('admin.catalog.emptySkills')}
                onSelect={setPickedCategory}
                selectedKey={pickedCategory?.id}
              />
            </AdminTableCard>
          )}
          detail={(
            <div className="side-panel">
              <AdminFormCard
                kicker={pickedCategory ? t('admin.catalog.editSkill') : t('admin.catalog.addSkill')}
                actions={(
                  <>
                    {pickedCategory ? (
                      <>
                        <button className="accent" disabled={busy} onClick={() => void saveCategory()}>{t('common.save')}</button>
                        <button className="ghost" disabled={busy} onClick={() => void api(`/admin/categories/${pickedCategory.id}`, { method: 'PUT', body: JSON.stringify({ is_active: pickedCategory.is_active === false }) }).then(load)}>
                          {pickedCategory.is_active === false ? t('admin.catalog.turnOn') : t('admin.catalog.turnOff')}
                        </button>
                      </>
                    ) : (
                      <button className="accent" disabled={busy || !categoryForm.slug || !categoryForm.name} onClick={() => void saveCategory(true)}>{t('admin.catalog.addSkill')}</button>
                    )}
                    <button className="ghost" type="button" onClick={() => { setPickedCategory(null); setCategoryForm(EMPTY_CATEGORY) }}>{t('admin.catalog.new')}</button>
                  </>
                )}
              >
                <div className="field">
                  <label>{t('admin.catalog.slug')}</label>
                  <input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} disabled={!!pickedCategory} />
                </div>
                <div className="field">
                  <label>{t('admin.catalog.skill')}</label>
                  <input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t('admin.catalog.nameHi')}</label>
                  <input value={categoryForm.name_hi} onChange={(e) => setCategoryForm({ ...categoryForm, name_hi: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t('admin.catalog.vertical')}</label>
                  <select value={categoryForm.vertical} onChange={(e) => setCategoryForm({ ...categoryForm, vertical: e.target.value as 'event' | 'task' | 'both' })}>
                    <option value="event">event</option>
                    <option value="task">task</option>
                    <option value="both">both</option>
                  </select>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label>{t('admin.catalog.rate')}</label>
                    <input type="number" min={100} value={categoryForm.default_rate_inr} onChange={(e) => setCategoryForm({ ...categoryForm, default_rate_inr: Number(e.target.value) })} />
                  </div>
                  <div className="field">
                    <label>{t('admin.catalog.duration')}</label>
                    <input type="number" min={30} value={categoryForm.default_duration_minutes} onChange={(e) => setCategoryForm({ ...categoryForm, default_duration_minutes: Number(e.target.value) })} />
                  </div>
                </div>
              </AdminFormCard>
            </div>
          )}
        />
      )}
    </AdminPage>
  )
}
