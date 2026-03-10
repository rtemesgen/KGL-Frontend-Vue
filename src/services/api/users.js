import { apiClient } from './client'

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/\s+/g, '-')

export const usersApiService = {
  async listUsers() {
    const { data } = await apiClient.get('/api/v1/users')
    return data?.data?.users || []
  },

  async deleteUser(id) {
    const { data } = await apiClient.delete(`/api/v1/users/${id}`)
    return data
  },

  async updateUserRole(id, role) {
    const { data } = await apiClient.patch(`/api/v1/users/${id}/role`, {
      role: normalizeRole(role),
    })
    return data
  },

  async listAuditEvents(params = {}) {
    const { data } = await apiClient.get('/api/v1/users/audit-events', { params })
    return data?.data || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  },
}
