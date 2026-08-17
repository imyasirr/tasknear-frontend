import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge } from '../../ui'
import { AdminAlert, AdminBoardCard, AdminBoardGrid, AdminEmpty, AdminPage } from './admin-ui'

type Shift = {
  id: number
  title?: string
  city?: string
  status?: string
  headcount: number
  filled: number
  open: number
  category?: { name: string }
}
type Worker = { id: number; user?: { id: number; name: string; phone: string }; rating_avg?: number }

export function AdminFillBoardPage() {
  const { t } = useI18n()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [openShift, setOpenShift] = useState<number | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  async function load() { setShifts(await api<Shift[]>('/admin/fill-board')) }
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  if (!ready) return <Loader />

  return (
    <AdminPage>
      <PageHeader
        title={t('nav.fillBoard')}
        subtitle="Override auto-match here if a shift is still short or a worker declined."
      />
      <AdminAlert message={error} />
      {shifts.length === 0 ? (
        <AdminEmpty message="No open shifts." />
      ) : (
        <AdminBoardGrid>
          {shifts.map((s) => (
            <AdminBoardCard
              key={s.id}
              status={<StatusBadge value={s.status} />}
              fillLabel={<span className="badge">{s.filled}/{s.headcount} filled</span>}
              title={s.title}
              meta={<><span>{s.category?.name}</span><span>{s.city}</span><span>{s.open} open</span></>}
              action={(
                <button
                  type="button"
                  className="ghost"
                  onClick={async () => {
                    setOpenShift(s.id)
                    setWorkers(await api<Worker[]>(`/admin/shifts/${s.id}/eligible-workers`))
                  }}
                >
                  Show eligible workers
                </button>
              )}
            >
              {openShift === s.id && (
                <>
                  {workers.map((w) => (
                    <div className="worker-row" key={w.id}>
                      <div>
                        <strong>{w.user?.name}</strong>
                        <div className="meta"><span>{w.user?.phone}</span><span>Rating {w.rating_avg}</span></div>
                      </div>
                      <button
                        type="button"
                        className="accent"
                        onClick={async () => {
                          await api(`/admin/shifts/${s.id}/assign`, { method: 'POST', body: JSON.stringify({ worker_user_id: w.user?.id }) })
                          await load()
                          setWorkers(await api<Worker[]>(`/admin/shifts/${s.id}/eligible-workers`))
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                  {workers.length === 0 && <p className="admin-form-hint">No eligible approved workers.</p>}
                </>
              )}
            </AdminBoardCard>
          ))}
        </AdminBoardGrid>
      )}
    </AdminPage>
  )
}
