import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, type Column } from '../../ui'

type Role = { role: string }
type UserRow = {
  id: number
  name: string
  phone: string
  city?: string
  roles?: Role[]
  caterer_profile?: {
    company_name?: string
    status?: string
    is_available?: boolean
    rating_avg?: number
    city?: string
    gstin?: string
    skills?: Array<{ category?: { name: string } }>
  } | null
}

const ROLE_TABS = ['all', 'customer', 'caterer', 'admin'] as const

export function AdminUsersPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<UserRow[]>([])
  const [tab, setTab] = useState('all')
  const [picked, setPicked] = useState<UserRow | null>(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api<UserRow[]>('/admin/users').then(setRows).catch((e) => setError(e.message)).finally(() => setReady(true))
  }, [])

  function roleLabel(role: string) {
    return t(`roles.${role}`) === `roles.${role}` ? role : t(`roles.${role}`)
  }

  function roleList(user: UserRow) {
    return (user.roles || []).map((r) => r.role)
  }

  const counts = useMemo(() => ({
    all: rows.length,
    customer: rows.filter((u) => roleList(u).includes('customer')).length,
    caterer: rows.filter((u) => roleList(u).includes('caterer')).length,
    admin: rows.filter((u) => roleList(u).includes('admin')).length,
  }), [rows])

  const list = useMemo(() => rows.filter((u) => {
    if (tab === 'all') return true
    return roleList(u).includes(tab)
  }), [rows, tab])

  const tabLabel: Record<string, string> = {
    all: t('tabs.all'),
    customer: t('tabs.clients'),
    caterer: t('tabs.caterers'),
    admin: t('tabs.admins'),
  }

  const columns: Column<UserRow>[] = [
    { key: 'name', header: t('cols.name'), sortValue: (u) => u.name, csv: (u) => u.name, render: (u) => <strong>{u.name}</strong> },
    { key: 'phone', header: t('cols.phone'), sortValue: (u) => u.phone, csv: (u) => u.phone, render: (u) => u.phone },
    { key: 'city', header: t('cols.city'), sortValue: (u) => u.city || '', csv: (u) => u.city || '', render: (u) => u.city || '—' },
    {
      key: 'roles',
      header: t('cols.roles'),
      sortValue: (u) => roleList(u).map(roleLabel).join(', '),
      csv: (u) => roleList(u).map(roleLabel).join(', '),
      render: (u) => (
        <div className="meta">
          {roleList(u).map((role) => <span key={role}>{roleLabel(role)}</span>)}
          {roleList(u).length === 0 && '—'}
        </div>
      ),
    },
    {
      key: 'caterer',
      header: t('cols.caterer'),
      sortValue: (u) => u.caterer_profile?.company_name || '',
      csv: (u) => u.caterer_profile?.company_name || '',
      render: (u) => u.caterer_profile ? (
        <>
          <div>{u.caterer_profile.company_name}</div>
          <StatusBadge value={u.caterer_profile.status || 'active'} />
        </>
      ) : '—',
    },
  ]

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title={t('users.title')} subtitle={t('users.subtitle')} />
      <div className="tabs">
        {ROLE_TABS.map((id) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {tabLabel[id]} ({counts[id]})
          </button>
        ))}
      </div>
      {error && <p className="err">{error}</p>}
      <div className="split">
        <div className="card flush">
          <DataTable
            rows={list}
            columns={columns}
            rowKey={(u) => u.id}
            filename="tasknear-users"
            searchPlaceholder={t('users.search')}
            selectedKey={picked?.id}
            onSelect={setPicked}
            empty={t('users.empty')}
          />
        </div>
        <div className="side-panel card">
          <div className="card-kicker">{t('users.profile')}</div>
          {picked ? (
            <>
              <h2>{picked.name}</h2>
              <div className="meta" style={{ marginBottom: 12 }}>
                {roleList(picked).map((role) => <span key={role}>{roleLabel(role)}</span>)}
              </div>
              <div className="kv">
                <div className="kv-row"><span>{t('cols.phone')}</span><strong>{picked.phone}</strong></div>
                <div className="kv-row"><span>{t('cols.city')}</span><strong>{picked.city || '—'}</strong></div>
                <div className="kv-row"><span>{t('users.roles')}</span><strong>{roleList(picked).map(roleLabel).join(', ') || '—'}</strong></div>
                {picked.caterer_profile && (
                  <>
                    <div className="kv-row"><span>{t('users.company')}</span><strong>{picked.caterer_profile.company_name}</strong></div>
                    <div className="kv-row"><span>{t('cols.caterer')}</span><StatusBadge value={picked.caterer_profile.status || 'active'} /></div>
                    <div className="kv-row"><span>{t('users.gstin')}</span><strong>{picked.caterer_profile.gstin || '—'}</strong></div>
                    <div className="kv-row"><span>{t('users.rating')}</span><strong>{picked.caterer_profile.rating_avg || 0}</strong></div>
                    <div className="kv-row"><span>{t('users.availability')}</span><strong>{picked.caterer_profile.is_available ? t('users.available') : t('users.offline')}</strong></div>
                    <div className="kv-row">
                      <span>{t('users.skills')}</span>
                      <strong>{(picked.caterer_profile.skills || []).map((s) => s.category?.name).filter(Boolean).join(', ') || '—'}</strong>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : <p>{t('common.selectRow')}</p>}
        </div>
      </div>
    </div>
  )
}
