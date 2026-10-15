import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/Adminpanel.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/footer',
    name: 'footer',
    component: () => import('@/components/AppFooter.vue')
  },
  {
    path: '/header',
    name: 'header',
    component: () => import('@/components/AppHeader.vue')
  },
  {
    path: '/order',
    name: 'order',
    component: () => import('@/views/Order.vue')
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('@/views/SignIn.vue')
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/SignUp.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/views/Favorites.vue')
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/Orders.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (!to.meta.requiresAdmin) return true

  let user
  try {
    user = JSON.parse(localStorage.getItem('velox_user') || 'null')
  } catch {
    user = null
  }

  const token = localStorage.getItem('velox_token')
  if (!token || user?.role !== 'ADMIN') {
    return { name: 'signin', query: { redirect: to.fullPath } }
  }

  return true
})

export default router