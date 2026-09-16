import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import DashboardView from '../views/DashboardView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import InvestmentsView from '../views/InvestmentsView.vue'
import { api } from '../services/api'
import { ensureSession } from '../services/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView
    },
    {
      path: '/',
      name: 'home',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/cupons',
      name: 'cupons',
      component: () => import('../views/CuponsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/investments',
      name: 'investments',
      component: InvestmentsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/markets',
      name: 'markets',
      component: () => import('../views/MarketsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

function getToken() {
  try { return localStorage.getItem('breyne_token') } catch { return null }
}

router.beforeEach(async (to, from, next) => {
  const token = getToken()
  if (token && api.isTokenExpired(token)) {
    api.logout()
  }
  const hasToken = getToken() !== null
  const authRoutes = ['login', 'register', 'forgot-password']

  if (to.meta.requiresAuth) {
    if (!hasToken) return next({ name: 'login' })
    const user = await ensureSession()
    if (!user) return next({ name: 'login' })
    return next()
  }

  if (authRoutes.includes(to.name) && hasToken) {
    const user = await ensureSession()
    if (user) return next({ name: 'home' })
  }

  next()
})

export default router
