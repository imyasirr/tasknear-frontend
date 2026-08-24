import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AppShell } from './layouts/AppShell'
import { AuthShell } from './layouts/AuthShell'
import { PublicShell } from './layouts/PublicShell'
import { HomePage } from './pages/public/HomePage'
import { AboutPage } from './pages/public/AboutPage'
import { PrivacyPage } from './pages/public/PrivacyPage'
import { TermsPage } from './pages/public/TermsPage'
import { ContactPage } from './pages/public/ContactPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { homeFor } from './auth/home'
import { ClientHome } from './pages/client/ClientHome'
import { EventDetailPage } from './pages/client/EventDetailPage'
import { PostJobPage } from './pages/client/PostJobPage'
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
import { WorkerHome } from './pages/worker/WorkerHome'
import { WorkerJobPage } from './pages/worker/WorkerJobPage'
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage'
import { WorkerEarningsPage } from './pages/worker/WorkerEarningsPage'
import { AdminPayoutsPage } from './pages/admin/AdminPayoutsPage'
import { AdminCitiesPage } from './pages/admin/AdminCitiesPage'
import { ClientVenueBookingPage } from './pages/client/ClientVenueBookingPage'
import { VenuesBrowsePage } from './pages/client/VenuesBrowsePage'
import { VenueDetailPage } from './pages/client/VenueDetailPage'
import { AdminBillingPage } from './pages/admin/AdminBillingPage'
import { AdminMatchingPage } from './pages/admin/AdminMatchingPage'
import { AdminKycPage } from './pages/admin/AdminKycPage'
import { AdminFillBoardPage } from './pages/admin/AdminFillBoardPage'
import { AdminTaskBoardPage } from './pages/admin/AdminTaskBoardPage'
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage'
import { PlansPage } from './pages/client/PlansPage'
import { VenueBookingDetailPage } from './pages/venue/VenueBookingDetailPage'
import { VenueEditPage } from './pages/venue/VenueEditPage'
import { VenueListingsPage } from './pages/venue/VenueListingsPage'
import { VenuePartnerHome } from './pages/venue/VenuePartnerHome'
import { VenuePartnerProfilePage } from './pages/venue/VenuePartnerProfilePage'
import { useI18n } from './i18n/LocaleContext'
import { Loader } from './ui'

function HomeRedirect() {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  if (loading) return <Loader label={t('common.loading')} />
  return <Navigate to={user ? homeFor(user.roles) : '/'} replace />
}

function Guard({ role, roles }: { role?: string; roles?: string[] }) {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const allowed = roles || (role ? [role] : undefined)
  if (loading) return <Loader label={t('common.loading')} />
  if (!user) return <Navigate to="/login" replace />
  if (allowed && !allowed.some((r) => user.roles.includes(r))) {
    return <Navigate to={homeFor(user.roles)} replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>
      <Route element={<AuthShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<Guard />}>
        <Route element={<Guard role="customer" />}>
          <Route
            path="/app"
            element={<AppShell portal="client" />}
          >
            <Route index element={<ClientHome />} />
            <Route path="post" element={<PostJobPage />} />
            <Route path="events/new" element={<Navigate to="/app/post" replace />} />
            <Route path="events/:slug" element={<EventDetailPage />} />
            <Route path="tasks/new" element={<Navigate to="/app/post" replace />} />
            <Route path="tasks/:slug" element={<TaskDetailPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="venues" element={<VenuesBrowsePage />} />
            <Route path="venues/:slug" element={<VenueDetailPage />} />
            <Route path="venue-bookings/:slug" element={<ClientVenueBookingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<Guard roles={['caterer', 'agency']} />}>
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
        <Route element={<Guard roles={['worker', 'driver', 'home_pro']} />}>
          <Route
            path="/worker"
            element={<AppShell portal="worker" />}
          >
            <Route index element={<WorkerHome />} />
            <Route path="jobs/:id" element={<WorkerJobPage />} />
            <Route path="earnings" element={<WorkerEarningsPage />} />
            <Route path="profile" element={<WorkerProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<Guard roles={['venue_partner']} />}>
          <Route path="/venue" element={<AppShell portal="venue" />}>
            <Route index element={<VenuePartnerHome />} />
            <Route path="listings" element={<VenueListingsPage />} />
            <Route path="listings/:id" element={<VenueEditPage />} />
            <Route path="bookings/:slug" element={<VenueBookingDetailPage />} />
            <Route path="profile" element={<VenuePartnerProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<Guard role="admin" />}>
          <Route
            path="/admin"
            element={<AppShell portal="admin" />}
          >
            <Route index element={<AdminHomePage />} />
            <Route path="catalog" element={<AdminCatalogPage />} />
            <Route path="cities" element={<AdminCitiesPage />} />
            <Route path="events/:slug?" element={<AdminEventsPage />} />
            <Route path="fill" element={<AdminFillBoardPage />} />
            <Route path="task-board" element={<AdminTaskBoardPage />} />
            <Route path="tasks/:slug?" element={<AdminTasksPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="kyc" element={<AdminKycPage />} />
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
