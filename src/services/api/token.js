const AUTH_TOKEN_STORAGE_KEY = 'karibu:auth:token'

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const getAuthToken = () => {
  if (!canUseStorage()) return ''
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ''
}

export const setAuthToken = (token) => {
  if (!canUseStorage()) return
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export const clearAuthToken = () => {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export { AUTH_TOKEN_STORAGE_KEY }
