import request from '@/utils/request'

export interface PageResult<T> {
  total: number
  page: number
  size: number
  list: T[]
}

export interface DoctorVO {
  id: number
  name: string
  gender: string
  phone: string
  avatarFileId: number | null
  hospitalId: number
  hospitalName?: string
  departmentId: number
  departmentName?: string
  title?: string
  specialty?: string
  intro?: string
  auditStatus: string
  cooperationStatus: string
  serviceStatus: string
  createdAt?: string
  attachments?: { fileId: number; fileType: string }[]
}

export interface DoctorForm {
  name: string
  gender: string
  phone: string
  avatarFileId?: number | null
  hospitalId: number | null
  departmentId: number | null
  title?: string
  specialty?: string
  intro?: string
  attachments?: { fileId: number; fileType: string }[]
}

export interface DoctorServiceItem {
  id: number
  doctorId: number
  name: string
  type?: string
  price: number
  description?: string
  status: string
}

export interface Hospital {
  id: number
  name: string
  code: string
  status: string
}

export interface Department {
  id: number
  hospitalId: number
  name: string
  code: string
  status: string
}

export interface DoctorAuditRecord {
  id: number
  doctorId: number
  fromStatus: string
  toStatus: string
  action: string
  reason?: string
  operatorId: number
  operatorName: string
  createdAt: string
}

export function pageDoctors(params: Record<string, unknown>): Promise<PageResult<DoctorVO>> {
  return request.get('/doctors', { params }) as Promise<PageResult<DoctorVO>>
}

export function getDoctor(id: number | string): Promise<DoctorVO> {
  return request.get(`/doctors/${id}`) as Promise<DoctorVO>
}

export function createDoctor(data: DoctorForm): Promise<number> {
  return request.post('/doctors', data) as Promise<number>
}

export function updateDoctor(id: number | string, data: DoctorForm): Promise<void> {
  return request.put(`/doctors/${id}`, data) as Promise<void>
}

export type AuditAction = 'approve' | 'reject' | 'suspend' | 'terminate' | 'resubmit'

export function auditDoctor(id: number | string, action: AuditAction, reason?: string): Promise<void> {
  return request.post(`/doctors/${id}/${action}`, { reason }) as Promise<void>
}

export function doctorOnShelf(id: number | string): Promise<void> {
  return request.post(`/doctors/${id}/on-shelf`) as Promise<void>
}

export function doctorOffShelf(id: number | string): Promise<void> {
  return request.post(`/doctors/${id}/off-shelf`) as Promise<void>
}

export function fetchAuditHistory(id: number | string): Promise<DoctorAuditRecord[]> {
  return request.get(`/doctors/${id}/audit-history`) as Promise<DoctorAuditRecord[]>
}

export function listDoctorServices(doctorId: number | string): Promise<DoctorServiceItem[]> {
  return request.get(`/doctors/${doctorId}/services`) as Promise<DoctorServiceItem[]>
}

export function createDoctorService(doctorId: number | string, data: Partial<DoctorServiceItem>): Promise<number> {
  return request.post(`/doctors/${doctorId}/services`, data) as Promise<number>
}

export function updateDoctorService(doctorId: number | string, itemId: number | string, data: Partial<DoctorServiceItem>): Promise<void> {
  return request.put(`/doctors/${doctorId}/services/${itemId}`, data) as Promise<void>
}

export function doctorServiceOnShelf(doctorId: number | string, itemId: number | string): Promise<void> {
  return request.post(`/doctors/${doctorId}/services/${itemId}/on-shelf`) as Promise<void>
}

export function doctorServiceOffShelf(doctorId: number | string, itemId: number | string): Promise<void> {
  return request.post(`/doctors/${doctorId}/services/${itemId}/off-shelf`) as Promise<void>
}

export function pageHospitals(params: Record<string, unknown>): Promise<PageResult<Hospital>> {
  return request.get('/hospitals', { params }) as Promise<PageResult<Hospital>>
}

export function listHospitals(): Promise<Hospital[]> {
  return request.get('/hospitals/all') as Promise<Hospital[]>
}

export function createHospital(data: Partial<Hospital>): Promise<number> {
  return request.post('/hospitals', data) as Promise<number>
}

export function updateHospital(id: number | string, data: Partial<Hospital>): Promise<void> {
  return request.put(`/hospitals/${id}`, data) as Promise<void>
}

export function deleteHospital(id: number | string): Promise<void> {
  return request.delete(`/hospitals/${id}`) as Promise<void>
}

export function changeHospitalStatus(id: number | string, enabled: boolean): Promise<void> {
  return request.post(`/hospitals/${id}/${enabled ? 'enable' : 'disable'}`) as Promise<void>
}

export function pageDepartments(params: Record<string, unknown>): Promise<PageResult<Department>> {
  return request.get('/departments', { params }) as Promise<PageResult<Department>>
}

export function listDepartmentsByHospital(hospitalId: number | string): Promise<Department[]> {
  return request.get(`/departments/by-hospital/${hospitalId}`) as Promise<Department[]>
}

export function createDepartment(data: Partial<Department>): Promise<number> {
  return request.post('/departments', data) as Promise<number>
}

export function updateDepartment(id: number | string, data: Partial<Department>): Promise<void> {
  return request.put(`/departments/${id}`, data) as Promise<void>
}

export function deleteDepartment(id: number | string): Promise<void> {
  return request.delete(`/departments/${id}`) as Promise<void>
}

export function changeDepartmentStatus(id: number | string, enabled: boolean): Promise<void> {
  return request.post(`/departments/${id}/${enabled ? 'enable' : 'disable'}`) as Promise<void>
}
