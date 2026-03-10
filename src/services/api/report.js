import { apiClient } from './client'

export const reportApiService = {
  async getOverview(params = {}) {
    const { data } = await apiClient.get('/api/v1/report/overview', { params })
    return data?.data || {}
  },

  async exportReport(params = {}) {
    const { data } = await apiClient.get('/api/v1/report/export', { params })
    return data?.data || data || null
  },
}
