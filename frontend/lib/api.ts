import axios from 'axios'
import type { Document, DocumentListResponse, Template, CreateTemplatePayload } from './types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export async function uploadDocument(file: File, templateType: string): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  form.append('template_type', templateType)
  const { data } = await api.post<Document>('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function batchUpload(files: File[], templateType: string): Promise<Document[]> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  form.append('template_type', templateType)
  const { data } = await api.post<Document[]>('/documents/batch-upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listDocuments(
  page = 1,
  status?: string
): Promise<DocumentListResponse> {
  const params: Record<string, string | number> = { page, size: 10 }
  if (status && status !== 'all') params.status = status
  const { data } = await api.get<DocumentListResponse>('/documents', { params })
  return data
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await api.get<Document>(`/documents/${id}`)
  return data
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`)
}

export async function exportJson(id: string): Promise<void> {
  const response = await api.get(`/documents/${id}/export/json`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `document-${id}.json`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function exportCsv(id: string): Promise<void> {
  const response = await api.get(`/documents/${id}/export/csv`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `document-${id}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function listTemplates(): Promise<Template[]> {
  const { data } = await api.get<Template[]>('/templates')
  return data
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<Template> {
  const { data } = await api.post<Template>('/templates', payload)
  return data
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`)
}
