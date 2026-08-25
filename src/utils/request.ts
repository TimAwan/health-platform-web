import axios from 'axios'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'health_token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000
})

request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    // 文件流直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    const body = response.data
    if (body && typeof body.code === 'number') {
      if (body.code === 200) {
        return body.data
      }
      if (body.code >= 401000 && body.code < 402000) {
        clearToken()
        if (location.pathname !== '/login') {
          location.href = '/login'
        }
      }
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message))
    }
    return body
  },
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      if (location.pathname !== '/login') {
        location.href = '/login'
      }
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || error.message || '网络异常'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// TODO: 二期接入 401 时静默刷新 access token（后端 /auth/refresh 已就绪）
export default request
