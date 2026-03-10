import { ref } from 'vue'
import { defineStore } from 'pinia'
import { inDateRange } from '@/utils/date'
import { accountingApiService } from '@/services/api/accounting'

const frontendBranch = (branch) => {
  const value = String(branch || '').trim().toLowerCase()
  if (value === 'maganjo') return 'Maganjo'
  if (value === 'matugga') return 'Matugga'
  return String(branch || '').trim() || 'Maganjo'
}

const toDateOnly = (value) => String(value || '').slice(0, 10)

const mapBackendCollection = (row = {}) => ({
  id: row._id || row.id || `CC-${Date.now()}`,
  backendId: row._id || row.id || '',
  transactionId: row.transactionId || row.saleId || row.reference || '',
  branch: frontendBranch(row.branch),
  date: toDateOnly(row.date || row.collectionDate || row.createdAt || new Date().toISOString()),
  createdAt: String(row.createdAt || row.collectionDate || `${toDateOnly(row.date)}T12:00:00`),
  name: String(row.customerName || row.name || '').trim(),
  nationalId: String(row.nationalId || row.nin || '').trim(),
  amountDue: Math.max(Number(row.amountDue || row.totalDue || row.creditAmount || row.amount || 0), 0),
  amountPaid: Math.max(Number(row.amountPaid || row.paidAmount || row.totalPaid || row.amount || 0), 0),
  outstandingAmount: Math.max(Number(row.outstandingAmount || row.balance || 0), 0),
  note: String(row.note || row.reference || '').trim(),
})

export const useCreditStore = defineStore('credits', () => {
  const rows = ref([])
  const payments = ref([])
  const backendRowsByBranch = ref({})
  const backendInitByBranch = ref({})

  const byBranch = (branch = '') => {
    const scopedBranch = String(branch || '').trim()
    return rows.value.filter((row) => !scopedBranch || row.branch === scopedBranch)
  }

  const byBranchAndDate = (branch, from, to) =>
    byBranch(branch).filter((row) => inDateRange(row.date, from, to))

  const outstandingMapByBranch = (branch = '') => {
    const map = {}
    byBranch(branch).forEach((row) => {
      if (!row.name) return
      map[row.name] = (map[row.name] || 0) + Math.max(Number(row.outstandingAmount || 0), 0)
    })
    return map
  }

  const paymentCustomerOptionsByBranch = (branch = '') =>
    Object.entries(outstandingMapByBranch(branch))
      .filter(([, amount]) => Number(amount || 0) > 0)
      .map(([name]) => name)

  const syncBackendRows = (remoteRows = [], scopedBranch = '') => {
    const mapped = remoteRows.map(mapBackendCollection)
    rows.value = [...rows.value.filter((row) => row.branch !== scopedBranch), ...mapped.filter((row) => row.branch === scopedBranch)]
    payments.value = mapped
      .filter((row) => row.branch === scopedBranch)
      .map((row) => ({
        id: row.id,
        branch: row.branch,
        customerName: row.name,
        amount: row.amountPaid,
        note: row.note,
        createdAt: row.createdAt,
        allocations: [],
      }))
    backendRowsByBranch.value = {
      ...backendRowsByBranch.value,
      [scopedBranch]: mapped.filter((row) => row.branch === scopedBranch),
    }
    backendInitByBranch.value = {
      ...backendInitByBranch.value,
      [scopedBranch]: Date.now(),
    }
    return backendRowsByBranch.value[scopedBranch]
  }

  const initializeAccounting = async (branch = '', force = false) => {
    const scopedBranch = String(branch || '').trim()
    if (!scopedBranch) return []
    if (backendInitByBranch.value[scopedBranch] && !force) {
      return backendRowsByBranch.value[scopedBranch] || []
    }

    const remoteRows = await accountingApiService.listCreditCollections()
    return syncBackendRows(remoteRows, scopedBranch)
  }

  const saveAccountingCollection = async ({ branch, date, customerName, amountPaid = 0, note = '' }) => {
    const normalizedBranch = String(branch || '').trim()
    const normalizedDate = String(date || '').trim()
    const normalizedName = String(customerName || '').trim()
    const paid = Math.max(Number(amountPaid || 0), 0)

    if (!normalizedBranch || !normalizedDate || !normalizedName || paid <= 0) {
      return { ok: false, error: 'Enter customer name, amount, and date.' }
    }

    const created = await accountingApiService.createCreditCollection({
      customerName: normalizedName,
      amount: paid,
      date: normalizedDate,
      note: String(note || '').trim(),
      branch: normalizedBranch,
    })

    const savedCollection = mapBackendCollection(created)
    const actualBranch = savedCollection.branch || normalizedBranch
    await initializeAccounting(actualBranch, true)

    if (actualBranch !== normalizedBranch) {
      await initializeAccounting(normalizedBranch, true)
      return {
        ok: true,
        warning: `Collection was saved under ${actualBranch}. The backend ignored the selected ${normalizedBranch} branch.`,
        row: savedCollection,
      }
    }

    return { ok: true, row: savedCollection }
  }

  const deleteCreditEntry = () => ({ ok: false, error: 'Backend delete endpoint for credit collections is not available.' })
  const saveManualEntry = () => ({ ok: false, error: 'Manual credit entries are disabled. Collections now use backend records only.' })
  const registerCreditSale = () => null
  const saveReceivedPayment = () => null

  return {
    rows,
    payments,
    byBranch,
    byBranchAndDate,
    outstandingMapByBranch,
    paymentCustomerOptionsByBranch,
    initializeAccounting,
    saveAccountingCollection,
    registerCreditSale,
    saveManualEntry,
    deleteCreditEntry,
    saveReceivedPayment,
  }
})
