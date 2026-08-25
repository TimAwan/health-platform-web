import request from '@/utils/request'
import type { PageResult } from './doctor'
import type { MenuNode } from './auth'

export interface SysUser {
  id: number
  username: string
  realName?: string
  phone?: string
  status: string
  lastLoginAt?: string
  createdAt?: string
  roleIds?: number[]
  roleNames?: string[]
}

export interface SysRole {
  id: number
  code: string
  name: string
  status: string
  remark?: string
}

export interface SysPermission {
  id: number
  code: string
  name: string
  type: string
  status: string
}

export interface OperationLog {
  id: number
  operatorId: number
  operatorName: string
  operation: string
  targetType?: string
  targetId?: string
  requestId?: string
  ip?: string
  result: string
  detail?: string
  createdAt: string
}

export function pageUsers(params: Record<string, unknown>): Promise<PageResult<SysUser>> {
  return request.get('/system/users', { params }) as Promise<PageResult<SysUser>>
}

export function createUser(data: Record<string, unknown>): Promise<number> {
  return request.post('/system/users', data) as Promise<number>
}

export function updateUser(id: number | string, data: Record<string, unknown>): Promise<void> {
  return request.put(`/system/users/${id}`, data) as Promise<void>
}

export function changeUserStatus(id: number | string, enabled: boolean): Promise<void> {
  return request.post(`/system/users/${id}/${enabled ? 'enable' : 'disable'}`) as Promise<void>
}

export function resetUserPassword(id: number | string, newPassword: string): Promise<void> {
  return request.post(`/system/users/${id}/password-reset`, { newPassword }) as Promise<void>
}

export function assignUserRoles(id: number | string, roleIds: number[]): Promise<void> {
  return request.put(`/system/users/${id}/roles`, { ids: roleIds }) as Promise<void>
}

export function pageRoles(params: Record<string, unknown>): Promise<PageResult<SysRole>> {
  return request.get('/system/roles', { params }) as Promise<PageResult<SysRole>>
}

export function listRoles(): Promise<SysRole[]> {
  return request.get('/system/roles/all') as Promise<SysRole[]>
}

export function createRole(data: Partial<SysRole>): Promise<number> {
  return request.post('/system/roles', data) as Promise<number>
}

export function updateRole(id: number | string, data: Partial<SysRole>): Promise<void> {
  return request.put(`/system/roles/${id}`, data) as Promise<void>
}

export function listAllPermissions(): Promise<SysPermission[]> {
  return request.get('/system/roles/permissions') as Promise<SysPermission[]>
}

export function getRolePermissionIds(id: number | string): Promise<number[]> {
  return request.get(`/system/roles/${id}/permissions`) as Promise<number[]>
}

export function assignRolePermissions(id: number | string, ids: number[]): Promise<void> {
  return request.put(`/system/roles/${id}/permissions`, { ids }) as Promise<void>
}

export function getRoleMenuIds(id: number | string): Promise<number[]> {
  return request.get(`/system/roles/${id}/menus`) as Promise<number[]>
}

export function assignRoleMenus(id: number | string, ids: number[]): Promise<void> {
  return request.put(`/system/roles/${id}/menus`, { ids }) as Promise<void>
}

export function fetchMenuTree(): Promise<MenuNode[]> {
  return request.get('/system/menus') as Promise<MenuNode[]>
}

export function createMenu(data: Record<string, unknown>): Promise<number> {
  return request.post('/system/menus', data) as Promise<number>
}

export function updateMenu(id: number | string, data: Record<string, unknown>): Promise<void> {
  return request.put(`/system/menus/${id}`, data) as Promise<void>
}

export function pageOperationLogs(params: Record<string, unknown>): Promise<PageResult<OperationLog>> {
  return request.get('/system/operation-logs', { params }) as Promise<PageResult<OperationLog>>
}
