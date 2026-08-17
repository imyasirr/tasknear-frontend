import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge } from '../../ui'
import { AdminBoardCard, AdminBoardGrid, AdminEmpty, AdminPage } from './admin-ui'

type Task = { id: number; title?: string; city?: string; status?: string; required_workers: number; filled: number; open: number }
type Worker = { id: number; user?: { id: number; name: string; phone: string } }

export function AdminTaskBoardPage() {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>([])
  const [openId, setOpenId] = useState<number | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [ready, setReady] = useState(false)

  async function load() { setTasks(await api<Task[]>('/admin/tasks')) }
  useEffect(() => { load().catch(() => setTasks([])).finally(() => setReady(true)) }, [])

  if (!ready) return <Loader />

  return (
    <AdminPage>
      <PageHeader
        title={t('nav.taskBoard')}
        subtitle="Weekday jobs for the same worker pool."
      />
      {tasks.length === 0 ? (
        <AdminEmpty message="No open tasks." />
      ) : (
        <AdminBoardGrid>
          {tasks.map((task) => (
            <AdminBoardCard
              key={task.id}
              status={<StatusBadge value={task.status} />}
              fillLabel={<span className="badge">{task.filled}/{task.required_workers} filled</span>}
              title={task.title}
              meta={<><span>{task.city}</span><span>{task.open} open</span></>}
              action={(
                <button
                  type="button"
                  className="ghost"
                  onClick={async () => {
                    setOpenId(task.id)
                    setWorkers(await api<Worker[]>(`/admin/tasks/${task.id}/eligible-workers`))
                  }}
                >
                  Show eligible workers
                </button>
              )}
            >
              {openId === task.id && workers.map((w) => (
                <div className="worker-row" key={w.id}>
                  <div>
                    <strong>{w.user?.name}</strong>
                    <div className="meta"><span>{w.user?.phone}</span></div>
                  </div>
                  <button
                    type="button"
                    className="accent"
                    onClick={async () => {
                      await api(`/admin/tasks/${task.id}/assign`, { method: 'POST', body: JSON.stringify({ worker_user_id: w.user?.id }) })
                      await load()
                      setWorkers(await api<Worker[]>(`/admin/tasks/${task.id}/eligible-workers`))
                    }}
                  >
                    Assign
                  </button>
                </div>
              ))}
            </AdminBoardCard>
          ))}
        </AdminBoardGrid>
      )}
    </AdminPage>
  )
}
