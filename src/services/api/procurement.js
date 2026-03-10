import { apiClient } from './client'

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => (
    value !== undefined &&
    value !== null &&
    value !== ''
  )),
)

const normalizeDateTime = (value) => {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export const procurementApiService = {
  async getOverview() {
    const { data } = await apiClient.get('/api/v1/procurement/overview')
    return data?.data?.overview || null
  },

  async listItems(params = {}) {
    const { data } = await apiClient.get('/api/v1/procurement/items', {
      params: cleanParams(params),
    })
    return {
      items: data?.data?.items || [],
      pagination: data?.data?.pagination || { page: 1, limit: 20, total: 0 },
    }
  },

  async createItem(payload) {
    const { data } = await apiClient.post('/api/v1/procurement/items', payload)
    return data?.data || data || null
  },

  async listSuppliers(params = {}) {
    const { data } = await apiClient.get('/api/v1/procurement/suppliers', {
      params: cleanParams(params),
    })
    return {
      suppliers: data?.data?.suppliers || [],
      pagination: data?.data?.pagination || { page: 1, limit: 20, total: 0 },
    }
  },

  async createSupplier(payload) {
    const { data } = await apiClient.post('/api/v1/procurement/suppliers', payload)
    return data?.data || data || null
  },

  async updateSupplier(id, payload) {
    const { data } = await apiClient.patch(`/api/v1/procurement/suppliers/${id}`, payload)
    return data?.data || data || null
  },

  async deleteSupplier(id) {
    const { data } = await apiClient.delete(`/api/v1/procurement/suppliers/${id}`)
    return data?.data || data || null
  },

  async recordSupplierPaymentAction(id, payload) {
    const { data } = await apiClient.post(`/api/v1/procurement/suppliers/${id}/payment-actions`, {
      amount: Number(payload.amount || 0),
      paymentMethod: payload.paymentMethod || 'cash',
      reference: payload.reference || '',
      note: payload.note || '',
      paymentDate: normalizeDateTime(payload.paymentDate || new Date()),
    })
    return data?.data || data || null
  },

  async listPurchases(params = {}) {
    const { data } = await apiClient.get('/api/v1/procurement/purchases', {
      params: cleanParams(params),
    })
    return {
      purchases: data?.data?.purchases || [],
      pagination: data?.data?.pagination || { page: 1, limit: 20, total: 0 },
    }
  },

  async getPurchase(id) {
    const { data } = await apiClient.get(`/api/v1/procurement/purchases/${id}`)
    return data?.data?.purchase || data?.data || null
  },

  async createPurchase(payload) {
    const { data } = await apiClient.post('/api/v1/procurement/purchases', {
      supplierId: payload.supplierId,
      paymentType: payload.paymentType,
      lines: payload.lines,
      discount: Number(payload.discount || 0),
      amountPaid: Number(payload.amountPaid || 0),
      paymentMethod: payload.paymentMethod || 'cash',
      reference: payload.reference || '',
      purchaseDate: normalizeDateTime(payload.purchaseDate || new Date()),
      note: payload.note || '',
    })
    return data?.data || data || null
  },

  async getStockReport(params = {}) {
    const { data } = await apiClient.get('/api/v1/procurement/stock-report', {
      params: cleanParams(params),
    })
    return data?.data || { summary: null, items: [] }
  },

  async getPurchaseReport(params = {}) {
    const { data } = await apiClient.get('/api/v1/procurement/purchase-report', {
      params: cleanParams(params),
    })
    return data?.data || { summary: null, purchases: [] }
  },

  async listReceipts(params = {}) {
    const { data } = await apiClient.get('/api/v1/procurement/receipts', {
      params: cleanParams(params),
    })
    return data?.data?.receipts || []
  },
}
