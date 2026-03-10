import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount, formatDateShort } from '@/utils/formatters'
import { inDateRange } from '@/utils/date'
import { reportApiService } from '@/services/api/report'
import { getApiMessage } from '@/services/api/client'
import { useCreditStore } from '@/stores/credits'
import { useExpenseStore } from '@/stores/expenses'
import { useInventoryStore } from '@/stores/inventory'
import { useOtherIncomeStore } from '@/stores/otherIncome'
import { useSalesStore } from '@/stores/sales'
import { useUsersStore } from '@/stores/users'

const salesColumns = [
  { key: 'date', label: 'Date', width: '82px', nowrap: true },
  { key: 'item', label: 'Item' },
  { key: 'price', label: 'Price', align: 'right', nowrap: true, numeric: true, width: '130px' },
]

const creditColumns = [
  { key: 'date', label: 'Date', width: '76px', nowrap: true },
  { key: 'name', label: 'Name', width: '114px', nowrap: true },
  { key: 'originalDue', label: 'Original Due', width: '96px', nowrap: true, numeric: true },
  { key: 'amountPaid', label: 'Received', width: '96px', nowrap: true, numeric: true },
  { key: 'outstandingAmount', label: 'Outstanding', width: '96px', nowrap: true, numeric: true },
  { key: 'status', label: 'Status', align: 'right', width: '84px', nowrap: true },
]

const expenseColumns = [
  { key: 'date', label: 'Date', width: '82px', nowrap: true },
  { key: 'reason', label: 'Reason' },
  { key: 'amount', label: 'Amount', nowrap: true, numeric: true, width: '124px' },
  { key: 'paidTo', label: 'Paid To', align: 'right', nowrap: true, width: '124px' },
]

const incomeColumns = [
  { key: 'date', label: 'Date', width: '82px', nowrap: true },
  { key: 'source', label: 'Source' },
  { key: 'details', label: 'Details' },
  { key: 'amount', label: 'Amount', nowrap: true, numeric: true, width: '124px' },
]

export const useReportsStore = defineStore('reports', () => {
  const users = useUsersStore()
  const inventory = useInventoryStore()
  const salesStore = useSalesStore()
  const creditStore = useCreditStore()
  const expenseStore = useExpenseStore()
  const otherIncomeStore = useOtherIncomeStore()

  const filters = reactive({
    from: '2026-03-01',
    to: '2026-03-31',
    creditStatus: 'ALL',
    category: 'all',
  })

  const expanded = reactive({
    sales: false,
    credit: false,
    expense: false,
    otherIncome: false,
  })

  const backendOverview = ref(null)
  const loadingOverview = ref(false)
  const backendError = ref('')

  const scopedBranch = computed(() => {
    if (!users.canSwitchBranch) return users.assignedBranch || null
    return inventory.activeBranch || null
  })

  const branchLabel = computed(() => scopedBranch.value || 'All Branches')
  const userName = computed(() => users.currentProfileName)
  const userRoleLabel = computed(() => users.currentRoleLabel)
  const footerText = computed(() => `2023 Dashboard Financial System - Generated for ${userRoleLabel.value} ${userName.value}`)

  const exportMeta = computed(() => ({
    Branch: branchLabel.value,
    Period: `${formatDateShort(filters.from)} to ${formatDateShort(filters.to)}`,
    GeneratedBy: `${userRoleLabel.value} ${userName.value}`,
  }))

  const visibleCategories = computed(() => ({
    sales: ['sales', 'all'].includes(filters.category),
    credit: ['credit', 'all'].includes(filters.category),
    expense: ['expense', 'all'].includes(filters.category),
    otherIncome: ['otherIncome', 'all'].includes(filters.category),
  }))

  const branchesInScope = computed(() => scopedBranch.value ? [scopedBranch.value] : Object.keys(inventory.branches || {}))
  const financial = computed(() => backendOverview.value?.financial || {})
  const receivablesPayables = computed(() => backendOverview.value?.receivablesPayables || {})

  const scopedTransactions = computed(() =>
    branchesInScope.value.flatMap((branch) =>
      salesStore.transactionsForBranch(branch).filter((transaction) => inDateRange(String(transaction.createdAt || '').slice(0, 10), filters.from, filters.to))
    )
  )

  const creditPayments = computed(() =>
    creditStore.payments.filter((payment) =>
      (!scopedBranch.value || payment.branch === scopedBranch.value)
      && inDateRange(String(payment.createdAt || '').slice(0, 10), filters.from, filters.to)
    )
  )

  const salesRows = computed(() =>
    salesStore.byBranchAndDate(scopedBranch.value, filters.from, filters.to).map((record) => {
      const stock = (inventory.branches[record.branch]?.stock || []).find((item) => item.sku === record.sku)
      const item = stock?.name || record.sku
      const price = Number(record.unitPrice || stock?.sellingPricePerKg || 0)

      return {
        ...record,
        item,
        amount: Math.round(Number(record.qtyKg || 0) * price),
      }
    })
  )

  // Credit rows come from customer balances because customer records stay accurate after collections, while sale rows can lag behind.
  const creditRowsBase = computed(() =>
    branchesInScope.value
      .flatMap((branch) => salesStore.customers.filter((customer) => customer.branch === branch))
      .filter((customer) => {
        const activityDate = String(customer.updatedAt || customer.createdAt || '').slice(0, 10)
        const hasCreditActivity = Number(customer.totalCredit || 0) > 0 || Number(customer.totalPaid || 0) > 0 || Number(customer.accountBalance || 0) > 0
        return hasCreditActivity && inDateRange(activityDate, filters.from, filters.to)
      })
      .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime())
      .map((customer, index) => ({
        id: `${customer.id || 'credit-customer'}-${index}`,
        date: String(customer.updatedAt || customer.createdAt || '').slice(0, 10),
        name: customer.fullName || 'Walk-in Customer',
        originalDue: Math.max(Number(customer.totalCredit || 0), 0),
        amountPaid: Math.max(Number(customer.totalPaid || 0), 0),
        outstandingAmount: Math.max(Number(customer.accountBalance || 0), 0),
        status: Number(customer.accountBalance || 0) > 0 ? 'Pending' : 'Cleared',
      }))
  )
  const creditRows = computed(() => {
    if (filters.creditStatus === 'ALL') return creditRowsBase.value
    if (filters.creditStatus === 'CLEARED') return creditRowsBase.value.filter((row) => row.outstandingAmount <= 0)
    return creditRowsBase.value.filter((row) => row.outstandingAmount > 0)
  })

  const expenseRows = computed(() => expenseStore.byBranchAndDate(scopedBranch.value, filters.from, filters.to))
  const otherIncomeRows = computed(() =>
    otherIncomeStore.byBranchAndDate(scopedBranch.value, filters.from, filters.to).map((row) => ({
      ...row,
      source: row.source || row.reason || 'Other Income',
      details: row.details || row.paidBy || '',
    }))
  )

  const salesTotal = computed(() => salesRows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0))
  const cashSalesTotal = computed(() =>
    scopedTransactions.value
      .filter((transaction) => transaction.type === 'cash')
      .reduce((sum, transaction) => sum + Number(transaction.total || 0), 0)
  )
  const creditOriginalTotal = computed(() => creditRows.value.reduce((sum, row) => sum + Number(row.originalDue || 0), 0))
  const creditPaidTotal = computed(() => creditRows.value.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0))
  const creditOutstandingTotal = computed(() => creditRows.value.reduce((sum, row) => sum + Number(row.outstandingAmount || 0), 0))
  const creditCollectionTotal = computed(() => creditPayments.value.reduce((sum, row) => sum + Number(row.amount || 0), 0))
  const expenseTotal = computed(() => expenseRows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0))
  const otherIncomeTotal = computed(() => otherIncomeRows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0))

  const cash = computed(() => {
    const cashSales = cashSalesTotal.value
    const creditCollections = Number(financial.value.totalCreditCollections ?? creditCollectionTotal.value)
    // Match the cashflow card to the visible Other Income report rows.
    const otherIncome = otherIncomeTotal.value

    return {
      cashSales,
      creditCollections,
      otherIncome,
      total: cashSales + creditCollections + otherIncome,
    }
  })

  const outflows = computed(() => {
    const recordedExpenses = Number(financial.value.totalExpenses ?? expenseTotal.value)
    const outstandingCredit = Number(receivablesPayables.value.totalCustomerReceivables ?? creditOutstandingTotal.value)

    return {
      recordedExpenses,
      outstandingCredit,
      total: recordedExpenses + outstandingCredit,
    }
  })

  const netProfit = computed(() => cash.value.total - outflows.value.total)

  const ensureBranchData = async () => {
    const branch = scopedBranch.value
    if (!branch) return

    await Promise.all([
      inventory.loadBranchStock(branch, true),
      salesStore.initialize(branch, true),
      creditStore.initializeAccounting(branch, true),
      expenseStore.initialize(branch, true),
      otherIncomeStore.initialize(branch, true),
    ])
  }

  const initialize = async () => {
    await ensureBranchData()

    loadingOverview.value = true
    try {
      const data = await reportApiService.getOverview({
        from: filters.from,
        to: filters.to,
        category: filters.category,
        creditStatus: filters.creditStatus,
        branch: scopedBranch.value || undefined,
      })
      backendOverview.value = data?.overview || data || null
      backendError.value = ''
      return backendOverview.value
    } catch (error) {
      backendOverview.value = null
      backendError.value = getApiMessage(error, 'Unable to load report overview.')
      return null
    } finally {
      loadingOverview.value = false
    }
  }

  const setFrom = (value) => {
    filters.from = value
    void initialize()
  }

  const setTo = (value) => {
    filters.to = value
    void initialize()
  }

  const setCreditStatus = (value) => {
    filters.creditStatus = value
    void initialize()
  }

  const setCategory = (value) => {
    filters.category = value
    void initialize()
  }

  const toggleExpanded = (key) => {
    expanded[key] = !expanded[key]
  }

  const branchSuffix = computed(() => branchLabel.value.toLowerCase().replace(/\s+/g, '-'))

  const exportSalesPdf = () =>
    exportReportToPdf({
      title: `Sales Report - ${branchLabel.value}`,
      columns: salesColumns,
      rows: salesRows.value.map((row) => ({
        date: formatDateShort(row.date),
        item: `${row.item} (${row.sku})`,
        price: formatAmount(row.amount),
      })),
      totals: { Total: formatAmount(salesTotal.value) },
      meta: exportMeta.value,
      filename: `sales-report-${branchSuffix.value}`,
    })

  const exportCreditPdf = () =>
    exportReportToPdf({
      title: `Credit Report - ${branchLabel.value}`,
      columns: creditColumns,
      rows: creditRows.value.map((row) => ({
        date: formatDateShort(row.date),
        name: row.name,
        originalDue: formatAmount(row.originalDue),
        amountPaid: formatAmount(row.amountPaid),
        outstandingAmount: formatAmount(row.outstandingAmount),
        status: row.outstandingAmount <= 0 ? 'Cleared' : 'Pending',
      })),
      totals: {
        'Original Due': formatAmount(creditOriginalTotal.value),
        Received: formatAmount(creditPaidTotal.value),
        Outstanding: formatAmount(creditOutstandingTotal.value),
      },
      meta: exportMeta.value,
      filename: `credit-report-${branchSuffix.value}`,
    })

  const exportExpensePdf = () =>
    exportReportToPdf({
      title: `Expenses Report - ${branchLabel.value}`,
      columns: expenseColumns,
      rows: expenseRows.value.map((row) => ({
        date: formatDateShort(row.date),
        reason: row.reason,
        amount: formatAmount(row.amount),
        paidTo: row.paidTo,
      })),
      totals: { 'Total Expense': formatAmount(expenseTotal.value) },
      meta: exportMeta.value,
      filename: `expenses-report-${branchSuffix.value}`,
    })

  const exportOtherIncomePdf = () =>
    exportReportToPdf({
      title: `Other Income Report - ${branchLabel.value}`,
      columns: incomeColumns,
      rows: otherIncomeRows.value.map((row) => ({
        date: formatDateShort(row.date),
        source: row.source,
        details: row.details,
        amount: formatAmount(row.amount),
      })),
      totals: { 'Total Income': formatAmount(otherIncomeTotal.value) },
      meta: exportMeta.value,
      filename: `other-income-report-${branchSuffix.value}`,
    })

  return {
    filters,
    expanded,
    userName,
    userRoleLabel,
    footerText,
    visibleCategories,
    branchLabel,
    cash,
    outflows,
    expenseTotal,
    netProfit,
    loadingOverview,
    backendError,
    salesColumns,
    creditColumns,
    expenseColumns,
    incomeColumns,
    creditFooterTemplate: '76px 114px 96px 96px 96px 84px',
    salesRows,
    creditRows,
    expenseRows,
    otherIncomeRows,
    salesTotal,
    creditOriginalTotal,
    creditPaidTotal,
    creditOutstandingTotal,
    otherIncomeTotal,
    setFrom,
    setTo,
    setCreditStatus,
    setCategory,
    toggleExpanded,
    initialize,
    exportSalesPdf,
    exportCreditPdf,
    exportExpensePdf,
    exportOtherIncomePdf,
  }
})
