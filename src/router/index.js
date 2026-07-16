import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import DashboardView from '../views/DashboardView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import InvestmentsView from '../views/InvestmentsView.vue'

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

router.beforeEach((to, from, next) => {
  const hasToken = getToken() !== null
  const authRoutes = ['login', 'register', 'forgot-password']

  if (to.meta.requiresAuth && !hasToken) {
    next({ name: 'login' })
  } else if (authRoutes.includes(to.name) && hasToken) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
