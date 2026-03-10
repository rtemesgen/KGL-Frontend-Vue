import { apiClient } from './client'

const normalizeBranch = (branch) => {
  const value = String(branch || '').trim().toLowerCase()
  if (value === 'maganjo') return 'Maganjo'
  if (value === 'matugga') return 'Matugga'
  return String(branch || '').trim()
}

const normalizeRegisterPayload = (payload) => ({
  name: String(payload.name || '').trim(),
  email: String(payload.email || '').trim().toLowerCase(),
  password: String(payload.password || ''),
  role: String(payload.role || '').trim().toLowerCase().replace(/\s+/g, '-'),
  branch: normalizeBranch(payload.branch),
})

export const authService = {
  async login(payload) {
    const { data } = await apiClient.post('/api/v1/auth/login', {
      email: String(payload.email || '').trim().toLowerCase(),
      password: String(payload.password || ''),
    })
    return data?.data || {}
  },

  async register(payload) {
    const { data } = await apiClient.post('/api/v1/auth/register', normalizeRegisterPayload(payload))
    return data?.data || {}
  },

  async me() {
    const { data } = await apiClient.get('/api/v1/auth/me')
    return data?.data?.user || null
  },
}
