import { defineStore } from 'pinia'
import { fetchMe, login as loginApi, logout as logoutApi, type LoginData, type MeVO } from '@/api/auth'
import { getToken, setToken, clearToken } from '@/utils/request'

interface UserState {
  token: string
  me: MeVO | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken(),
    me: null
  }),
  getters: {
    permissions(state): Set<string> {
      return new Set(state.me?.permissions ?? [])
    }
  },
  actions: {
    async login(data: LoginData) {
      const token = await loginApi(data)
      setToken(token.accessToken)
      this.token = token.accessToken
      localStorage.setItem('health_refresh_token', token.refreshToken)
    },
    async fetchMe() {
      if (!this.me) {
        this.me = await fetchMe()
      }
    },
    async logout() {
      try {
        await logoutApi(`Bearer ${this.token}`)
      } catch {
        // 服务端注销失败不阻塞本地退出
      }
      clearToken()
      localStorage.removeItem('health_refresh_token')
      this.token = ''
      this.me = null
    },
    has(permission: string): boolean {
      return this.permissions.has(permission)
    }
  }
})
