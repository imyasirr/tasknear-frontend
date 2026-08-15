import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AppShell } from './layouts/AppShell'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { homeFor } from './auth/home'
import { ClientHome } from './pages/client/ClientHome'
import { NewEventPage } from './pages/client/NewEventPage'
import { EventDetailPage } from './pages/client/EventDetailPage'
import { NewTaskPage } from './pages/client/NewTaskPage'
import { TaskDetailPage } from './pages/client/TaskDetailPage'
import { AdminHomePage } from './pages/admin/AdminHomePage'
import { AdminEventsPage } from './pages/admin/AdminEventsPage'
import { AdminTasksPage } from './pages/admin/AdminTasksPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminActivityPage } from './pages/admin/AdminActivityPage'
import { SettingsPage } from './pages/SettingsPage'
import { CatererHome } from './pages/caterer/CatererHome'
import { CatererJobPage } from './pages/caterer/CatererJobPage'
import { CatererProfilePage } from './pages/caterer/CatererProfilePage'
import { CatererEarningsPage } from './pages/caterer/CatererEarningsPage'
import { AdminPayoutsPage } from './pages/admin/AdminPayoutsPage'
import { AdminCitiesPage } from './pages/admin/AdminCitiesPage'
import { PlansPage } from './pages/client/PlansPage'
import { AdminBillingPage } from './pages/admin/AdminBillingPage'
import { AdminMatchingPage } from './pages/admin/AdminMatchingPage'
import { useI18n } from './i18n/LocaleContext'
import { Loader } from './ui'

function HomeRedirect() {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  if (loading) return <Loader label={t('common.loading')} />
  return <Navigate to={user ? homeFor(user.roles) : '/login'} replace />
}

function Guard({ role }: { role?: string }) {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  if (loading) return <Loader label={t('common.loading')} />
  if (!user) return <Navigate to="/login" replace />
  if (role && !user.roles.includes(role)) {
    return <Navigate to={homeFor(user.roles)} replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<Guard />}>
        <Route element={<Guard role="customer" />}>
          <Route
            path="/app"
            element={<AppShell portal="client" />}
          >
            <Route index element={<ClientHome />} />
            <Route path="events/new" element={<NewEventPage />} />
            <Route path="events/:slug" element={<EventDetailPage />} />
            <Route path="tasks/new" element={<NewTaskPage />} />
            <Route path="tasks/:slug" element={<TaskDetailPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<Guard role="caterer" />}>
          <Route
            path="/caterer"
            element={<AppShell portal="caterer" />}
          >
            <Route index element={<CatererHome />} />
            <Route path="jobs/:slug" element={<CatererJobPage />} />
            <Route path="earnings" element={<CatererEarningsPage />} />
            <Route path="profile" element={<CatererProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<Guard role="admin" />}>
          <Route
            path="/admin"
            element={<AppShell portal="admin" />}
          >
            <Route index element={<AdminHomePage />} />
            <Route path="cities" element={<AdminCitiesPage />} />
            <Route path="events/:slug?" element={<AdminEventsPage />} />
            <Route path="fill" element={<AdminEventsPage />} />
            <Route path="tasks/:slug?" element={<AdminTasksPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="payouts" element={<AdminPayoutsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="billing" element={<AdminBillingPage />} />
            <Route path="matching" element={<AdminMatchingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
