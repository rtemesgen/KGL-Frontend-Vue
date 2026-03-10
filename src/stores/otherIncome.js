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

const mapIncome = (row = {}) => ({
  id: row._id || row.id || '',
  backendId: row._id || row.id || '',
  branch: frontendBranch(row.branch),
  date: String(row.date || row.incomeDate || row.createdAt || '').slice(0, 10),
  source: String(row.source || row.reason || row.type || '').trim(),
  reason: String(row.reason || row.source || row.type || '').trim(),
  details: String(row.details || row.note || '').trim(),
  amount: Math.max(Number(row.amount || 0), 0),
  paidBy: String(row.paidBy || row.payer || '').trim(),
})

export const useOtherIncomeStore = defineStore('otherIncome', {
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
        const remoteRows = await accountingApiService.listOtherIncome()
        const mapped = remoteRows.map(mapIncome).filter((row) => row.branch === scopedBranch)
        this.rows = [...this.rows.filter((row) => row.branch !== scopedBranch), ...mapped]
        this.initializedByBranch = { ...this.initializedByBranch, [scopedBranch]: Date.now() }
        return mapped
      } finally {
        this.loading = false
      }
    },

    async saveIncome(payload) {
      const source = String(payload.source || payload.reason || '').trim()
      const details = String(payload.details || '').trim()
      const branch = String(payload.branch || '').trim()
      const date = String(payload.date || '').trim()
      const amount = Math.max(Number(payload.amount || 0), 0)

      if (!source || !branch || !date || amount <= 0) {
        return { ok: false, error: 'Enter source, amount, and date.' }
      }

      try {
        const created = await accountingApiService.createOtherIncome({ source, details, amount, date, branch })
        const savedIncome = mapIncome(created)
        const actualBranch = savedIncome.branch || branch

        await this.initialize(actualBranch, true)
        if (actualBranch !== branch) {
          await this.initialize(branch, true)
          return {
            ok: true,
            warning: `Income was saved under ${actualBranch}. The backend ignored the selected ${branch} branch.`,
          }
        }
        return { ok: true }
      } catch (error) {
        return { ok: false, error: getApiMessage(error, 'Unable to save income.') }
      }
    },

    async deleteIncome(id) {
      const row = this.rows.find((entry) => String(entry.id) === String(id))
      if (!row?.backendId) return { ok: false, error: 'No backend income record found.' }
      return { ok: false, error: 'Backend delete endpoint for other income is not available.' }
    },
  },
})
