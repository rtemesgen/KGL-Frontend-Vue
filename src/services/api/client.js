import axios from 'axios'
import { pinia } from '@/stores'
import { useUiStore } from '@/stores/ui'
import { clearAuthToken, getAuthToken, setAuthToken } from './token'

const USERS_STORE_STORAGE_KEY = 'karibu:pinia:users'
const INVENTORY_STORE_STORAGE_KEY = 'karibu:pinia:inventory'
const BRANCH_SCOPED_PREFIXES = ['/api/v1/accounting', '/api/v1/sales', '/api/v1/procurement', '/api/v1/users', '/api/v1/report']

const getPersistedStore = (storageKey) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const getPersistedUsersToken = () => String(getPersistedStore(USERS_STORE_STORAGE_KEY)?.authToken || '').trim()

const getPersistedRole = () => {
  const state = getPersistedStore(USERS_STORE_STORAGE_KEY)
  const sessionRole = String(state?.sessionUser?.role || '').trim().toLowerCase()
  if (sessionRole) return sessionRole

  const activeProfileId = state?.activeProfileId
  const profileRole = String(state?.profiles?.[activeProfileId]?.role || '').trim().toLowerCase()
  return profileRole
}

const getPersistedBranch = () => String(getPersistedStore(INVENTORY_STORE_STORAGE_KEY)?.activeBranch || '').trim()

const syncPersistedUsersAuth = (overrides = {}) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return

  try {
    const raw = window.localStorage.getItem(USERS_STORE_STORAGE_KEY)
    if (!raw) return
    const state = JSON.parse(raw)
    window.localStorage.setItem(USERS_STORE_STORAGE_KEY, JSON.stringify({
      ...state,
      ...overrides,
    }))
  } catch {
    // Ignore persistence sync issues and let runtime auth flow recover.
  }
}

const shouldAttachBranch = (config) => {
  const url = String(config?.url || '')
  return BRANCH_SCOPED_PREFIXES.some((prefix) => url.startsWith(prefix))
}

const applyBranchQuery = (config) => {
  const role = getPersistedRole()
  if (!['admin', 'director'].includes(role)) return config

  const branch = getPersistedBranch()
  if (!branch) return config
  if (!shouldAttachBranch(config)) return config

  // Admin/director requests follow the active UI branch through the query string.
  config.params = config.params || {}
  if (!config.params.branch) config.params.branch = branch
  return config
}

const beginTrackedRequest = (config) => {
  if (config?.skipGlobalLoading) return config
  useUiStore(pinia).startLoading()
  config.__globalLoadingTracked = true
  return config
}

const finishTrackedRequest = (config) => {
  if (!config?.__globalLoadingTracked) return
  useUiStore(pinia).stopLoading()
}

const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim()

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required. Set it before starting or building the app.')
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  beginTrackedRequest(config)

  const token = getAuthToken() || getPersistedUsersToken()
  if (token) {
    setAuthToken(token)
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return applyBranchQuery(config)
})

apiClient.interceptors.response.use(
  (response) => {
    finishTrackedRequest(response?.config)
    return response
  },
  (error) => {
    finishTrackedRequest(error?.config)

    if (error?.response?.status === 401) {
      clearAuthToken()
      syncPersistedUsersAuth({
        authToken: '',
        isAuthenticated: false,
        sessionUser: null,
        activeProfileId: null,
      })
    }
    return Promise.reject(error)
  },
)

export const getApiMessage = (error, fallback = 'Request failed.') => (
  (!error?.response ? 'Backend unavailable. Please check server connection.' : null) ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback
)
