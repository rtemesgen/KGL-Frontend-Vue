import { defineStore } from 'pinia'
import { inDateRange } from '@/utils/date'
import { accountingApiService } from '@/services/api/accounting'
import { getApiMessage } from '@/services/api/client'
import { useUsersStore } from '@/stores/users'

const frontendBranch = (branch) => {
  const value = String(branch || '').trim().toLowerCase()
  if (value === 'maganjo') return 'Maganjo'
  if (value === 'matugga') return 'Matugga'
  return String(branch || '').trim() || 'Maganjo'
}

const mapExpense = (row = {}) => ({
  id: row._id || row.id || '',
  backendId: row._id || row.id || '',
  branch: frontendBranch(row.branch),
  date: String(row.date || row.expenseDate || row.createdAt || '').slice(0, 10),
  reason: String(row.reason || row.description || row.title || '').trim(),
  amount: Math.max(Number(row.amount || 0), 0),
  paidTo: String(row.paidTo || row.vendor || row.payee || row.note || '').trim(),
})

const parseAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(value, 0) : 0
  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')
    .trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0
}

export const useExpenseStore = defineStore('expenses', {
  state: () => ({
    rows: [],
    loading: false,
    initializedByBranch: {},
  }),
  getters: {
    byBranchAndDate: (state) => (branch, from, to) =>
      state.rows.filter((r) => (!branch || r.branch === branch) && inDateRange(r.date, from, to)),
  },
  actions: {
    async initialize(branch = '', force = false) {
      const users = useUsersStore()
      const scopedBranch = String(branch || users.assignedBranch || '').trim()
      if (!scopedBranch) return []
      if (this.initializedByBranch[scopedBranch] && !force) {
        return this.rows.filter((row) => row.branch === scopedBranch)
      }

      this.loading = true
      try {
        const remoteRows = await accountingApiService.listExpenses()
        const mapped = remoteRows.map(mapExpense).filter((row) => row.branch === scopedBranch)
        this.rows = [...this.rows.filter((row) => row.branch !== scopedBranch), ...mapped]
        this.initializedByBranch = { ...this.initializedByBranch, [scopedBranch]: Date.now() }
        return mapped
      } finally {
        this.loading = false
      }
    },

    async saveExpense(payload) {
      const reason = String(payload.reason || '').trim()
      const paidTo = String(payload.paidTo || '').trim()
      const branch = String(payload.branch || '').trim()
      const date = String(payload.date || '').trim()
      const amount = parseAmount(payload.amount)

      if (!reason) return { ok: false, error: 'Enter expense reason.' }
      if (amount <= 0) return { ok: false, error: 'Enter a valid expense amount greater than 0.' }
      if (!paidTo) return { ok: false, error: 'Enter who was paid.' }
      if (!branch || !date) return { ok: false, error: 'Missing branch or date. Reload and try again.' }

      try {
        const created = await accountingApiService.createExpense({ reason, amount, paidTo, date, branch })
        const savedExpense = mapExpense(created)
        const actualBranch = savedExpense.branch || branch

        await this.initialize(actualBranch, true)
        if (actualBranch !== branch) {
          await this.initialize(branch, true)
          return {
            ok: true,
            warning: `Expense was saved under ${actualBranch}. The backend ignored the selected ${branch} branch.`,
          }
        }

        return { ok: true }
      } catch (error) {
        return { ok: false, error: getApiMessage(error, 'Unable to save expense.') }
      }
    },

    async deleteExpense(id) {
      const row = this.rows.find((entry) => String(entry.id) === String(id))
      if (!row?.backendId) return { ok: false, error: 'No backend expense record found.' }

      try {
        await accountingApiService.deleteExpense(row.backendId)
        this.rows = this.rows.filter((entry) => String(entry.id) !== String(id))
        return { ok: true }
      } catch (error) {
        return { ok: false, error: getApiMessage(error, 'Unable to delete expense.') }
      }
    },
  },
})
