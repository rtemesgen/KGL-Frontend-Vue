import { createRouter, createWebHistory } from 'vue-router'
import { toast } from 'vue3-toastify'

import AccountingPage from '@/pages/Accounting/AccountingPage.vue'
import AuthPage from '@/pages/Auth/AuthPage.vue'
import Dashboard from '@/pages/Dashboard/Dashboard.vue'
import ProcurementPage from '@/pages/Procurement/ProcurementPage.vue'
import ReportsPage from '@/pages/Reports/ReportsPage.vue'
import SalesPage from '@/pages/Sales/SalesPage.vue'
import UsersPage from '@/pages/Users/UsersPage.vue'
import { pinia } from '@/stores'
import { useUsersStore } from '@/stores/users'
import { canAccessRoute } from './auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'Auth',
      component: AuthPage,
      meta: { public: true },
    },
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
    },
    {
      path: '/sales',
      name: 'Sales',
      component: SalesPage,
      meta: { requiredAccess: 'sales' },
    },
    {
      path: '/procurement',
      name: 'Procurement',
      component: ProcurementPage,
      meta: { requiredAccess: 'procurement' },
    },
    {
      path: '/accounting',
      name: 'Accounting',
      component: AccountingPage,
      meta: { requiredAccess: 'accounting' },
    },
    {
      path: '/users',
      name: 'Users',
      component: UsersPage,
      meta: { requiredAccess: 'users' },
    },
    {
      path: '/reports',
      name: 'Reports',
      component: ReportsPage,
      meta: { requiredAccess: 'reports' },
    },
    {
      path: '/login',
      redirect: '/auth',
    },
    {
      path: '/register',
      redirect: '/auth',
    },
    {
      path: '/user',
      redirect: '/users',
    },
  ],
})

router.beforeEach(async (to) => {
  const usersStore = useUsersStore(pinia)

  if (!usersStore.authInitialized) {
    await usersStore.hydrateSession()
  }

  if (!usersStore.isAuthenticated && !to.meta?.public) {
    return { name: 'Auth' }
  }

  if (usersStore.isAuthenticated && to.meta?.public) {
    return { name: usersStore.defaultRouteName }
  }

  const canAccess = canAccessRoute(to.meta?.requiredAccess, usersStore.allowedCardKeys)
  if (canAccess) return true

  toast.error('Access denied: your role cannot open this page.')
  return { name: usersStore.defaultRouteName }
})

export default router
