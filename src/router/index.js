import { createRouter, createWebHistory } from 'vue-router'
import { canAccessRoute } from '@/router/auth'
import { useUsersStore } from '@/stores/users'
import AuthPage from '@/pages/Auth/AuthPage.vue'
import DashboardPage from '@/pages/Dashboard/Dashboard.vue'
import SalesPage from '@/pages/Sales/SalesPage.vue'
import ProcurementPage from '@/pages/Procurement/ProcurementPage.vue'
import AccountingPage from '@/pages/Accounting/AccountingPage.vue'
import ReportsPage from '@/pages/Reports/ReportsPage.vue'
import UsersPage from '@/pages/Users/UsersPage.vue'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: AuthPage,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/sales',
    name: 'Sales',
    component: SalesPage,
    meta: { requiresAuth: true, requiredAccess: 'sales' },
  },
  {
    path: '/procurement',
    name: 'Procurement',
    component: ProcurementPage,
    meta: { requiresAuth: true, requiredAccess: 'procurement' },
  },
  {
    path: '/accounting',
    name: 'Accounting',
    component: AccountingPage,
    meta: { requiresAuth: true, requiredAccess: 'accounting' },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ReportsPage,
    meta: { requiresAuth: true, requiredAccess: 'reports' },
  },
  {
    path: '/users',
    name: 'Users',
    component: UsersPage,
    meta: { requiresAuth: true, requiredAccess: 'users' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const users = useUsersStore()
  await users.hydrateSession()

  if (to.meta?.guestOnly && users.isAuthenticated) {
    return { name: users.defaultRouteName }
  }

  if (to.meta?.requiresAuth && !users.isAuthenticated) {
    return { name: 'Auth' }
  }

  if (to.meta?.requiredAccess && !canAccessRoute(to.meta.requiredAccess, users.allowedCardKeys)) {
    return { name: users.defaultRouteName }
  }

  return true
})

export default router
