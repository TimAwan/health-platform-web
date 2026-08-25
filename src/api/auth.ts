import request from '@/utils/request'

export interface LoginData {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}

export interface TokenVO {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface MenuNode {
  id: number
  parentId: number
  name: string
  path: string
  component: string | null
  icon: string | null
  sort: number
  status: string
  children?: MenuNode[]
}

export interface MeVO {
  userId: number
  username: string
  realName: string
  permissions: string[]
  menus: MenuNode[]
}

export function login(data: LoginData): Promise<TokenVO> {
  return request.post('/auth/login', data) as Promise<TokenVO>
}

export function fetchCaptcha(): Promise<{ captchaId: string; image: string }> {
  return request.get('/auth/captcha') as Promise<{ captchaId: string; image: string }>
}

export function logout(authorization: string): Promise<void> {
  return request.post('/auth/logout', null, { headers: { Authorization: authorization } }) as Promise<void>
}

export function fetchMe(): Promise<MeVO> {
  return request.get('/system/me') as Promise<MeVO>
}
