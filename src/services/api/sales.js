import { apiClient } from './client'

export const salesApiService = {
  async getDashboard() {
    const { data } = await apiClient.get('/api/v1/sales/dashboard')
    return data?.data?.dashboard || { totals: {}, byType: {}, recentSales: [] }
  },

  async listSales(params = {}) {
    const { data } = await apiClient.get('/api/v1/sales', { params })
    return data?.data?.sales || []
  },

  async getDailyReport(params = {}) {
    const { data } = await apiClient.get('/api/v1/sales/daily-report', { params })
    return data?.data || { summary: {}, sales: [] }
  },

  async listCustomers(params = {}) {
    const { data } = await apiClient.get('/api/v1/sales/customers', { params })
    return data?.data?.customers || []
  },

  async createCustomer(payload) {
    const { data } = await apiClient.post('/api/v1/sales/customers', payload)
    return data?.data?.customer || data?.data || null
  },

  async updateCustomer(id, payload) {
    const { data } = await apiClient.patch(`/api/v1/sales/customers/${id}`, payload)
    return data?.data?.customer || data?.data || null
  },

  async deleteCustomer(id) {
    const { data } = await apiClient.delete(`/api/v1/sales/customers/${id}`)
    return data
  },

  async createCashSale(payload) {
    const { data } = await apiClient.post('/api/v1/sales/cash-sales', payload)
    return data?.data?.sale || data?.data || null
  },

  async createCreditSale(payload) {
    const { data } = await apiClient.post('/api/v1/sales/credit-sales', payload)
    return data?.data?.sale || data?.data || null
  },

  async addCustomerPayment(customerId, payload) {
    const { data } = await apiClient.post(`/api/v1/sales/customers/${customerId}/payments`, payload)
    return data?.data?.payment || data?.data || null
  },
}
