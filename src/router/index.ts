import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { MenuNode } from '@/api/auth'

const viewModules = import.meta.glob('../views/**/*.vue')

const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout/Index.vue'),
    redirect: '/doctor/list',
    children: []
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes
})

let dynamicRoutesRegistered = false

export function resetDynamicRoutes() {
  dynamicRoutesRegistered = false
}

export function registerDynamicRoutes(menus: MenuNode[]) {
  if (dynamicRoutesRegistered) {
    return
  }
  for (const menu of menus) {
    if (menu.children && menu.children.length > 0) {
      router.addRoute('layout', {
        path: menu.path,
        children: menu.children
          .filter((child) => child.component)
          .map((child) => ({
            path: child.path,
            component: viewModules[`../views/${child.component}.vue`],
            meta: { title: child.name, menuId: child.id }
          }))
      })
    } else if (menu.component) {
      router.addRoute('layout', {
        path: menu.path,
        component: viewModules[`../views/${menu.component}.vue`],
        meta: { title: menu.name }
      })
    }
  }
  dynamicRoutesRegistered = true
}

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  if (to.path === '/login') {
    return true
  }
  if (!userStore.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (!userStore.me) {
    try {
      await userStore.fetchMe()
    } catch {
      await userStore.logout()
      return { path: '/login' }
    }
    registerDynamicRoutes(userStore.me.menus)
    return { path: to.fullPath, replace: true }
  }
  if (!dynamicRoutesRegistered) {
    registerDynamicRoutes(userStore.me.menus)
  }
  if (to.name === 'not-found' && userStore.me.menus.length > 0) {
    ElMessage.warning('页面不存在或无访问权限')
    return { path: userStore.me.menus[0]?.path ?? '/doctor/list' }
  }
  return true
})

export default router
