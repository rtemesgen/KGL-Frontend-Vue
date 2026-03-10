import { apiClient } from './client'

const asArray = (value) => (Array.isArray(value) ? value : [])

const pickRows = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

export const accountingApiService = {
  async getOverview(params = {}) {
    const { data } = await apiClient.get('/api/v1/accounting/overview', { params })
    return data?.data || {}
  },

  async listExpenses(params = {}) {
    const { data } = await apiClient.get('/api/v1/accounting/expenses', { params })
    return asArray(pickRows(data?.data || {}, ['expenses', 'rows', 'items']))
  },

  async createExpense(payload) {
    const body = {
      title: String(payload?.title || payload?.reason || '').trim(),
      amount: Number(payload?.amount || 0),
      category: String(payload?.category || 'General').trim() || 'General',
      note: String(payload?.note || payload?.paidTo || '').trim(),
      expenseDate: String(payload?.expenseDate || payload?.date || '').trim() || undefined,
      branch: String(payload?.branch || '').trim() || undefined,
    }
    const { data } = await apiClient.post('/api/v1/accounting/expenses', body)
    return data?.data?.expense || data?.data || null
  },

  async deleteExpense(id) {
    const { data } = await apiClient.delete(`/api/v1/accounting/expenses/${id}`)
    return data?.data || data || null
  },

  async listOtherIncome(params = {}) {
    const { data } = await apiClient.get('/api/v1/accounting/other-income', { params })
    return asArray(pickRows(data?.data || {}, ['otherIncome', 'income', 'rows', 'items']))
  },

  async createOtherIncome(payload) {
    const body = {
      source: String(payload?.source || payload?.reason || '').trim(),
      amount: Number(payload?.amount || 0),
      note: String(payload?.details || payload?.note || '').trim(),
      incomeDate: String(payload?.incomeDate || payload?.date || '').trim() || undefined,
      branch: String(payload?.branch || '').trim() || undefined,
    }
    const { data } = await apiClient.post('/api/v1/accounting/other-income', body)
    return data?.data?.income || data?.data?.otherIncome || data?.data || null
  },

  async listCreditCollections(params = {}) {
    const { data } = await apiClient.get('/api/v1/accounting/credit-collections', { params })
    return asArray(pickRows(data?.data || {}, ['creditCollections', 'collections', 'rows', 'items']))
  },

  async createCreditCollection(payload) {
    const body = {
      customerName: String(payload?.customerName || payload?.name || '').trim(),
      amount: Number(payload?.amount || payload?.amountPaid || 0),
      paymentMethod: 'cash',
      reference: String(payload?.reference || '').trim(),
      note: String(payload?.note || '').trim(),
      collectionDate: String(payload?.collectionDate || payload?.date || '').trim() || undefined,
      branch: String(payload?.branch || '').trim() || undefined,
    }
    const { data } = await apiClient.post('/api/v1/accounting/credit-collections', body)
    return data?.data?.collection || data?.data?.creditCollection || data?.data || null
  },
}
