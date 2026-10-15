import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('velox_token')?.trim()
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  }
  return config
})

export function normalizeListResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.result)) return data.result
  return []
}

export function resolveApiError(error, fallbackMessage) {
  const status = error?.response?.status
  const detail = error?.response?.data?.message || error?.response?.data?.error || error?.message
  if (status) return `${fallbackMessage} (HTTP ${status})${detail ? `: ${detail}` : ''}`
  return detail || fallbackMessage
}

export default api
