import request from '@/utils/request'

export interface FileVO {
  fileId: number
  originalName: string
  contentType?: string
  size: number
  bizType?: string
}

export function uploadFile(file: File, bizType: string): Promise<FileVO> {
  const form = new FormData()
  form.append('file', file)
  form.append('bizType', bizType)
  return request.post('/files', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }) as Promise<FileVO>
}

/** 带鉴权下载文件流，返回可用的对象 URL（img src / a href） */
export async function fetchFileUrl(fileId: number | string): Promise<string> {
  const response = await request.get(`/files/${fileId}/download`, { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}

export function deleteFile(fileId: string): Promise<void> {
  return request.delete(`/files/${fileId}`) as Promise<void>
}
