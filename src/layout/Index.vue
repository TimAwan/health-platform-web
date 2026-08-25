<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">
        <svg class="pulse" viewBox="0 0 64 20" aria-hidden="true">
          <polyline
            points="0,10 14,10 20,4 27,16 33,10 44,10 50,6 56,13 64,10"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <span class="brand-name">健康管理平台</span>
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#10201e"
        text-color="#9db4b1"
        active-text-color="#ffffff"
      >
        <template v-for="menu in userStore.me?.menus ?? []" :key="menu.id">
          <el-sub-menu v-if="menu.children?.length" :index="menu.path">
            <template #title>
              <el-icon><component :is="menuIcon(menu.path)" /></el-icon>
              <span>{{ menu.name }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.id" :index="child.path">
              {{ child.name }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">{{ menu.name }}</el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-if="pageTitle">{{ pageTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-dropdown @command="onCommand">
          <span class="user-entry">
            <el-avatar :size="28" class="user-avatar">{{ avatarChar }}</el-avatar>
            <span class="user-name">{{ userStore.me?.realName || userStore.me?.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main">
        <router-view :key="route.fullPath" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { resetDynamicRoutes } from '@/router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageTitle = computed(() => (route.meta.title as string) ?? '')
const avatarChar = computed(() => (userStore.me?.realName || userStore.me?.username || '?').slice(0, 1))

function menuIcon(path: string): string {
  if (path.startsWith('/doctor')) {
    return 'UserFilled'
  }
  if (path.startsWith('/base')) {
    return 'OfficeBuilding'
  }
  if (path.startsWith('/system')) {
    return 'Setting'
  }
  return 'Menu'
}

async function onCommand(command: string) {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定退出登录吗？', '退出登录', { type: 'warning' })
    await userStore.logout()
    resetDynamicRoutes()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout {
  height: 100%;
}

.aside {
  background: var(--hp-sidebar);
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  color: #e7f3f1;
}

.pulse {
  width: 44px;
  height: 16px;
  color: #2dd4bf;
}

.brand-name {
  font-size: 15px;
  letter-spacing: 1px;
  font-weight: 600;
}

.aside :deep(.el-menu) {
  border-right: none;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e8edec;
}

.user-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  background: var(--hp-primary);
  color: #fff;
}

.user-name {
  color: var(--hp-ink);
}

.main {
  background: var(--hp-bg);
}
</style>
