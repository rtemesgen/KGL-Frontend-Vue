import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { inDateRange } from '@/utils/date'
import { salesApiService } from '@/services/api/sales'
import { useInventoryStore } from '@/stores/inventory'
import { useCreditStore } from '@/stores/credits'

const padDatePart = (value) => String(value).padStart(2, '0')
const localTimestamp = (date = new Date()) => `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`
const ROWS_PER_PAGE = 6
const DEFAULT_LEDGER_OUTSTANDING = 115500

const cloneItems = (items) => items.map((item) => ({ ...item }))
const sumItems = (items) => items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0)
const uniqueNames = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))]
const normalizeName = (value) => String(value || '').trim().toLowerCase()
const normalizeSearch = (value) => String(value || '').trim().toLowerCase()

const frontendBranch = (branch) => {
  const value = String(branch || '').trim().toLowerCase()
  if (value === 'maganjo') return 'Maganjo'
  if (value === 'matugga') return 'Matugga'
  return String(branch || '').trim() || 'Maganjo'
}

const defaultCreditForm = () => ({
  customerName: '',
  nationalId: '',
})

const defaultCustomerForm = () => ({
  fullName: '',
  nationalId: '',
  phone: '',
  address: '',
})

const defaultPaymentForm = () => ({
  customerId: '',
  customerName: '',
  amount: '',
  note: '',
})

const createTransaction = ({
  id,
  backendId = '',
  branch,
  createdAt,
  cashier,
  type = 'cash',
  status,
  items,
  customerName = 'Walk-in Customer',
  nationalId = '',
  amountPaid,
  downPayment = 0,
  refundedAmount = 0,
  customerLedgerBefore = DEFAULT_LEDGER_OUTSTANDING,
}) => {
  const lineItems = cloneItems(items)
  const subtotal = sumItems(lineItems)
  const tax = 0
  const total = subtotal + tax
  const normalizedType = type === 'credit' ? 'credit' : 'cash'
  const normalizedStatus = status || (normalizedType === 'credit' ? 'pending' : 'completed')
  const normalizedDownPayment = normalizedType === 'credit' ? Math.max(Number(downPayment || 0), 0) : 0
  const normalizedAmountPaid = normalizedType === 'cash'
    ? Math.max(Number(amountPaid ?? total), total)
    : normalizedDownPayment
  const outstandingAmount = normalizedType === 'credit'
    ? Math.max(total - normalizedDownPayment, 0)
    : 0

  return {
    id,
    backendId,
    branch,
    createdAt,
    cashier,
    type: normalizedType,
    paymentMethod: normalizedType === 'credit' ? 'Credit' : 'Cash',
    status: normalizedStatus,
    items: lineItems,
    customerName,
    nationalId,
    subtotal,
    tax,
    total,
    creditAmountDue: normalizedType === 'credit' ? total : 0,
    amountPaid: normalizedAmountPaid,
    downPayment: normalizedDownPayment,
    outstandingAmount,
    refundedAmount: Math.max(Number(refundedAmount || 0), 0),
    customerLedgerAfter: normalizedType === 'credit'
      ? Number(customerLedgerBefore || 0) + outstandingAmount
      : Number(customerLedgerBefore || 0),
  }
}

const mapBackendSale = (sale) => {
  const items = (sale?.lines || []).map((line) => ({
    backendItemId: line.item || '',
    sku: line.sku,
    qty: Number(line.quantity || 0),
    name: line.itemName || line.sku || 'Item',
    detail: `SKU: ${line.sku || ''}`,
    unitPrice: Number(line.unitPrice || 0),
  }))

  return createTransaction({
    id: sale?.saleNo || sale?._id || '',
    backendId: sale?._id || '',
    branch: frontendBranch(sale?.branch),
    createdAt: sale?.createdAt || sale?.saleDate || localTimestamp(),
    cashier: 'System User',
    type: sale?.saleType === 'credit' ? 'credit' : 'cash',
    status: Number(sale?.balanceDue || 0) > 0 ? 'pending' : 'completed',
    items,
    customerName: sale?.customerName || 'Walk-in Customer',
    nationalId: sale?.customerNin || '',
    amountPaid: Number(sale?.amountPaid || 0),
    downPayment: Number(sale?.amountPaid || 0),
    customerLedgerBefore: Number(sale?.customer?.accountBalance || 0),
  })
}

const mapBackendCustomer = (customer) => ({
  id: customer?._id || customer?.id || '',
  branch: frontendBranch(customer?.branch),
  fullName: String(customer?.name || '').trim(),
  nationalId: String(customer?.nin || '').trim(),
  phone: String(customer?.tel || '').trim(),
  address: String(customer?.address || '').trim(),
  accountBalance: Number(customer?.accountBalance || 0),
  totalCredit: Number(customer?.totalCredit || 0),
  totalPaid: Number(customer?.totalPaid || 0),
})

export const useSalesStore = defineStore('sales', () => {
  const inventory = useInventoryStore()
  const credits = useCreditStore()
  const salesReportDate = ref(localTimestamp().slice(0, 10))
  const activeView = ref('pos')
  const creditForm = reactive(defaultCreditForm())
  const customerForm = reactive(defaultCustomerForm())
  const paymentForm = reactive(defaultPaymentForm())
  const creditModalOpen = ref(false)
  const customerModalOpen = ref(false)
  const paymentModalOpen = ref(false)
  const customerBranch = ref('')
  const paymentBranch = ref('')
  const transactions = ref({ Maganjo: [], Matugga: [] })
  const customers = ref([])
  const receiptModalOpen = ref(false)
  const activeReceipt = ref(null)
  const searchQuery = ref('')
  const statusFilter = ref('all')
  const paymentFilter = ref('all')
  const periodFilter = ref('today')
  const currentPage = ref(1)
  const orderSequence = ref(882940)
  const initializedBranch = ref('')
  const loading = ref(false)

  const monthKey = computed(() => String(salesReportDate.value || '').slice(0, 7))
  const reportDate = computed(() => salesReportDate.value)
  const allTransactions = computed(() => Object.values(transactions.value).flat())
  const payments = computed(() => credits.payments)
  const currentOrderId = computed(() => `#POS-${String(orderSequence.value).slice(-4)}`)

  const branchCustomers = (branch) => customers.value.filter((customer) => !branch || customer.branch === branch)
  const paymentCustomerOptions = computed(() => branchCustomers(paymentBranch.value)
    .filter((customer) => Number(customer.accountBalance || 0) > 0)
    .map((customer) => ({
      id: customer.id,
      label: String(customer.fullName || '').trim(),
      balance: Number(customer.accountBalance || 0),
      nationalId: String(customer.nationalId || '').trim(),
      phone: String(customer.phone || '').trim(),
    })))

  const paymentOutstandingMap = computed(() => paymentCustomerOptions.value.reduce((map, customer) => {
    map[customer.id] = customer.balance
    return map
  }, {}))

  const transactionsForBranch = (branch) =>
    [...(transactions.value[branch] || [])]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

  const transactionLineRows = computed(() =>
    Object.entries(transactions.value).flatMap(([branch, branchTransactions]) =>
      branchTransactions.flatMap((transaction) =>
        (transaction.items || []).map((item, index) => ({
          id: `${transaction.id}-${item.sku}-${index}`,
          branch,
          date: String(transaction.createdAt || '').slice(0, 10),
          createdAt: transaction.createdAt,
          sku: item.sku,
          qtyKg: Number(item.qty || 0),
          unitPrice: Number(item.unitPrice || 0),
          itemName: item.name,
          transactionId: transaction.id,
          customerName: transaction.customerName,
          cashier: transaction.cashier,
          type: transaction.type,
        }))
      )
    )
  )

  const records = computed(() =>
    Object.fromEntries(
      Object.entries(transactions.value).map(([branch, branchTransactions]) => [
        branch,
        branchTransactions.flatMap((transaction) =>
          (transaction.items || []).map((item, index) => ({
            id: `${transaction.id}-${item.sku}-${index}`,
            date: String(transaction.createdAt || '').slice(0, 10),
            sku: item.sku,
            qtyKg: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice || 0),
          }))
        ),
      ])
    )
  )

  const customerOptions = computed(() => uniqueNames(branchCustomers(customerBranch.value).map((customer) => customer.fullName)))

  const totalTodaySalesAllBranches = computed(() =>
    Object.keys(transactions.value).reduce((sum, branch) => sum + todaySalesByBranch(branch), 0)
  )

  const nextTimestamp = () => localTimestamp()

  const syncRemoteSequence = (sales = []) => {
    const values = sales.map((sale) => {
      const match = String(sale?.saleNo || '').match(/-(\d+)$/)
      return match ? Number(match[1]) : 0
    }).filter((value) => Number.isFinite(value) && value > 0)
    if (!values.length) return
    orderSequence.value = Math.max(orderSequence.value, ...values)
  }

  const initialize = async (branch = '', force = false) => {
    const scopedBranch = String(branch || '').trim()
    if (!scopedBranch) return false
    if (initializedBranch.value === scopedBranch && !force) return true

    loading.value = true
    try {
      await inventory.loadBranchStock(scopedBranch, true)

      const [remoteSales, remoteCustomers] = await Promise.all([
        salesApiService.listSales(),
        salesApiService.listCustomers(),
      ])

      const mappedSales = remoteSales.map(mapBackendSale)
      const mappedCustomers = remoteCustomers.map(mapBackendCustomer)
      transactions.value = {
        ...transactions.value,
        [scopedBranch]: mappedSales.filter((sale) => sale.branch === scopedBranch),
      }
      customers.value = [
        ...customers.value.filter((customer) => customer.branch !== scopedBranch),
        ...mappedCustomers.filter((customer) => customer.branch === scopedBranch),
      ]
      syncRemoteSequence(remoteSales)
      initializedBranch.value = scopedBranch
      return true
    } finally {
      loading.value = false
    }
  }

  const resetPager = () => {
    currentPage.value = 1
  }

  const setActiveView = (view) => {
    activeView.value = view === 'report' ? 'report' : 'pos'
  }

  const syncCreditIdentity = () => {
    const name = normalizeName(creditForm.customerName)
    if (!name) return
    const match = customers.value.find(
      (customer) => (!customerBranch.value || customer.branch === customerBranch.value)
        && normalizeName(customer.fullName) === name,
    )
    if (match?.nationalId) creditForm.nationalId = match.nationalId
  }

  const openCreditModal = (branch = '') => {
    customerBranch.value = String(branch || '')
    syncCreditIdentity()
    creditModalOpen.value = true
  }

  const closeCreditModal = () => {
    creditModalOpen.value = false
    customerBranch.value = ''
  }

  const openCustomerModal = (branch = '') => {
    customerBranch.value = String(branch || '')
    customerModalOpen.value = true
  }

  const closeCustomerModal = () => {
    customerModalOpen.value = false
    customerBranch.value = ''
  }

  const openPaymentModal = (branch = '') => {
    paymentBranch.value = String(branch || '')
    paymentModalOpen.value = true
  }

  const closePaymentModal = () => {
    paymentModalOpen.value = false
    paymentBranch.value = ''
  }

  const resetCreditForm = () => {
    Object.assign(creditForm, defaultCreditForm())
  }

  const resetCustomerForm = () => {
    Object.assign(customerForm, defaultCustomerForm())
  }

  const resetPaymentForm = () => {
    Object.assign(paymentForm, defaultPaymentForm())
  }

  const updateCreditField = (field, value) => {
    if (field !== 'customerName' && field !== 'nationalId') return
    creditForm[field] = String(value || '')
    if (field === 'customerName') syncCreditIdentity()
  }

  const updateCustomerField = (field, value) => {
    if (!Object.hasOwn(customerForm, field)) return
    customerForm[field] = String(value || '')
  }

  const selectPaymentCustomer = (customer) => {
    if (!customer?.id) return
    paymentForm.customerId = String(customer.id || '')
    paymentForm.customerName = String(customer.label || customer.fullName || '')
    const outstanding = Number(customer.balance || paymentOutstandingMap.value[paymentForm.customerId] || 0)
    const currentAmount = Number(paymentForm.amount || 0)
    if (currentAmount > outstanding) {
      paymentForm.amount = outstanding > 0 ? String(outstanding) : ''
    }
  }

  const updatePaymentField = (field, value) => {
    if (!Object.hasOwn(paymentForm, field)) return

    if (field === 'customerName') {
      paymentForm.customerName = String(value || '')
      const exactMatch = paymentCustomerOptions.value.find((customer) => normalizeName(customer.label) === normalizeName(paymentForm.customerName))
      if (exactMatch) {
        paymentForm.customerId = exactMatch.id
        paymentForm.customerName = exactMatch.label
      } else {
        paymentForm.customerId = ''
      }
      const outstanding = Number(paymentOutstandingMap.value[paymentForm.customerId] || 0)
      const currentAmount = Number(paymentForm.amount || 0)
      if (currentAmount > outstanding) {
        paymentForm.amount = outstanding > 0 ? String(outstanding) : ''
      }
      return
    }

    if (field === 'amount') {
      const numeric = String(value || '').replace(/\D/g, '')
      const outstanding = Number(paymentOutstandingMap.value[paymentForm.customerId] || 0)
      if (!numeric) {
        paymentForm.amount = ''
        return
      }
      paymentForm.amount = String(Math.min(Number(numeric), outstanding || 0))
      return
    }

    paymentForm[field] = String(value || '')
  }

  const saveCustomer = async () => {
    const fullName = String(customerForm.fullName || '').trim()
    const branch = String(customerBranch.value || '').trim()
    if (!fullName || !branch) return null

    const saved = await salesApiService.createCustomer({
      name: fullName,
      tel: String(customerForm.phone || '').trim(),
      nin: String(customerForm.nationalId || '').trim(),
      address: String(customerForm.address || '').trim(),
    })
    if (!saved) return null

    const customer = mapBackendCustomer(saved)
    customers.value = [customer, ...customers.value.filter((entry) => entry.id !== customer.id)]
    creditForm.customerName = customer.fullName
    if (customer.nationalId) creditForm.nationalId = customer.nationalId
    resetCustomerForm()
    closeCustomerModal()
    return customer
  }

  const findTransactionById = (transactionId) => allTransactions.value.find((entry) => entry.id === transactionId)

  const syncTransactionFromCreditRow = (creditRow) => {
    if (!creditRow?.transactionId || String(creditRow.transactionId).startsWith('MANUAL-')) return null
    const transaction = findTransactionById(creditRow.transactionId)
    if (!transaction) return null

    const ledgerAmountDue = Math.max(Number(creditRow.amountDue || 0), 0)
    const ledgerAmountPaid = Math.max(Number(creditRow.amountPaid || 0), 0)
    const outstandingAmount = Math.max(ledgerAmountDue - ledgerAmountPaid, 0)

    transaction.customerName = String(creditRow.name || transaction.customerName || '').trim() || transaction.customerName
    transaction.nationalId = String(creditRow.nationalId || transaction.nationalId || '').trim()
    transaction.creditAmountDue = ledgerAmountDue
    transaction.amountPaid = ledgerAmountPaid
    transaction.downPayment = ledgerAmountPaid
    transaction.outstandingAmount = outstandingAmount
    transaction.status = outstandingAmount > 0 ? 'pending' : 'completed'
    transaction.customerLedgerAfter = outstandingAmount

    return transaction
  }

  const clearTransactionCreditState = (creditRow) => {
    if (!creditRow?.transactionId || String(creditRow.transactionId).startsWith('MANUAL-')) return null
    const transaction = findTransactionById(creditRow.transactionId)
    if (!transaction) return null

    const total = Math.max(Number(transaction.total || 0), 0)
    transaction.creditAmountDue = total
    transaction.amountPaid = total
    transaction.downPayment = total
    transaction.outstandingAmount = 0
    transaction.status = 'completed'
    transaction.customerLedgerAfter = 0

    return transaction
  }

  const applyPaymentToTransactions = (allocations = []) => {
    allocations.forEach((allocationRow) => {
      const transaction = findTransactionById(allocationRow.transactionId)
      if (!transaction) return

      const allocation = Number(allocationRow.amount || 0)
      if (allocation <= 0) return

      const currentOutstanding = Number(transaction.outstandingAmount || 0)
      transaction.outstandingAmount = Math.max(currentOutstanding - allocation, 0)
      transaction.downPayment = Number(transaction.downPayment || 0) + allocation
      transaction.amountPaid = Number(transaction.amountPaid || 0) + allocation
      transaction.status = transaction.outstandingAmount > 0 ? 'pending' : 'completed'
      transaction.customerLedgerAfter = Math.max(Number(transaction.customerLedgerAfter || 0) - allocation, 0)
    })
  }

  const recordCreditPayment = ({ branch, customerName, amount, note = '', createdAt } = {}) => {
    const scopedBranch = String(branch || paymentBranch.value || '').trim()
    const normalizedName = String(customerName || '').trim()
    const normalizedAmount = Number(amount || 0)

    if (!normalizedName || normalizedAmount <= 0 || !scopedBranch) return null

    const payment = credits.saveReceivedPayment({
      branch: scopedBranch,
      customerName: normalizedName,
      amount: normalizedAmount,
      note: String(note || '').trim(),
      createdAt: String(createdAt || nextTimestamp()),
    })
    if (!payment) return null

    applyPaymentToTransactions(payment.allocations)
    return payment
  }

  const saveCreditLedgerEntry = (payload = {}) => {
    const savedRow = credits.saveManualEntry(payload)
    if (!savedRow) return null
    syncTransactionFromCreditRow(savedRow)
    return { row: savedRow }
  }

  const deleteCreditLedgerEntry = (id) => {
    const deletedRow = credits.deleteCreditEntry(id)
    if (!deletedRow) return null
    clearTransactionCreditState(deletedRow)
    return deletedRow
  }

  const saveReceivedPayment = async ({ branch } = {}) => {
    const scopedBranch = String(branch || paymentBranch.value || '').trim()
    const customerId = String(paymentForm.customerId || '').trim()
    const amount = Number(paymentForm.amount || 0)
    const targetCustomer = branchCustomers(scopedBranch).find((customer) => customer.id === customerId) || branchCustomers(scopedBranch).find((customer) => normalizeName(customer.fullName) === normalizeName(String(paymentForm.customerName || '').trim()))

    if (!targetCustomer || amount <= 0) return null

    const payment = await salesApiService.addCustomerPayment(targetCustomer.id, {
      amount,
      paymentMethod: 'cash',
      note: String(paymentForm.note || '').trim(),
      paymentDate: nextTimestamp(),
    })

    await initialize(scopedBranch, true)
    resetPaymentForm()
    closePaymentModal()
    return { ...payment, amount }
  }

  const registerTransaction = (branch, transaction) => {
    const branchName = String(branch || '')
    if (!transactions.value[branchName]) transactions.value[branchName] = []
    transactions.value[branchName] = [transaction, ...transactions.value[branchName].filter((entry) => entry.id !== transaction.id)]
    return transaction
  }

  const enrichSaleItems = (branch, items = []) =>
    cloneItems(items)
      .map((item) => {
        const stockItem = (inventory.branches[branch]?.stock || []).find((stock) => stock.sku === item.sku)
        return {
          backendItemId: stockItem?.backendId || stockItem?.id || item.backendItemId || '',
          sku: item.sku,
          qty: Number(item.qty || 0),
          name: stockItem?.name || item.name || item.sku,
          detail: `SKU: ${item.sku}`,
          unitPrice: Number(stockItem?.sellingPricePerKg ?? item.unitPrice ?? 0),
        }
      })
      .filter((item) => item.sku && item.qty > 0 && item.backendItemId)

  const saveCashTransaction = async ({ branch, cashier, openReceipt = false, items = null }) => {
    const sourceItems = enrichSaleItems(branch, items && items.length ? items : [])
    if (!sourceItems.length) return null

    const saved = await salesApiService.createCashSale({
      lines: sourceItems.map((item) => ({ itemId: item.backendItemId, quantity: item.qty, unitPrice: item.unitPrice })),
      note: '',
    })

    const transaction = saved ? mapBackendSale(saved) : null
    if (transaction) registerTransaction(branch, transaction)
    await initialize(branch, true)
    await inventory.loadBranchStock(branch, true)

    const latest = transaction || transactionsForBranch(branch)[0] || null
    if (openReceipt && latest) {
      activeReceipt.value = latest
      receiptModalOpen.value = true
    }

    return latest
  }

  const saveCreditTransaction = async ({ branch, cashier, items = null }) => {
    const sourceItems = enrichSaleItems(branch, items && items.length ? items : [])
    const targetCustomer = branchCustomers(branch).find((customer) => normalizeName(customer.fullName) === normalizeName(creditForm.customerName))
    if (!sourceItems.length || !targetCustomer) return null

    const saved = await salesApiService.createCreditSale({
      customerId: targetCustomer.id,
      lines: sourceItems.map((item) => ({ itemId: item.backendItemId, quantity: item.qty, unitPrice: item.unitPrice })),
      amountPaid: 0,
      note: '',
    })

    const transaction = saved ? mapBackendSale(saved) : null
    if (transaction) registerTransaction(branch, transaction)
    await initialize(branch, true)
    await inventory.loadBranchStock(branch, true)
    closeCreditModal()

    const latest = transaction || transactionsForBranch(branch)[0] || null
    if (latest) {
      activeReceipt.value = latest
      receiptModalOpen.value = true
    }
    return latest
  }

  const closeReceipt = () => {
    receiptModalOpen.value = false
    activeReceipt.value = null
  }

  const openReceiptById = (branch, id) => {
    const match = (transactions.value[branch] || []).find((transaction) => transaction.id === id)
    if (!match) return
    activeReceipt.value = match
    receiptModalOpen.value = true
  }

  const openLatestReceipt = (branch) => {
    const latest = (transactions.value[branch] || [])[0]
    if (!latest) return
    activeReceipt.value = latest
    receiptModalOpen.value = true
  }

  const setSearchQuery = (value) => {
    searchQuery.value = value
    resetPager()
  }

  const setStatusFilter = (value) => {
    statusFilter.value = value
    resetPager()
  }

  const setPaymentFilter = (value) => {
    paymentFilter.value = value
    resetPager()
  }

  const setPeriodFilter = (value) => {
    periodFilter.value = value
    resetPager()
  }

  const setPage = (value) => {
    currentPage.value = Math.max(1, Number(value || 1))
  }

  const setSalesReportDate = (value) => {
    if (!value) return
    salesReportDate.value = String(value)
  }

  const periodFilteredTransactions = (branch) => {
    const branchTransactions = transactionsForBranch(branch)
    const currentDate = salesReportDate.value

    if (periodFilter.value === 'today') {
      return branchTransactions.filter((transaction) => transaction.createdAt.startsWith(currentDate))
    }

    if (periodFilter.value === '7d') {
      return branchTransactions.filter((transaction) => transaction.createdAt.slice(0, 7) === currentDate.slice(0, 7))
    }

    return branchTransactions
  }

  const filteredTransactions = (branch) => {
    const query = normalizeSearch(searchQuery.value)

    return periodFilteredTransactions(branch).filter((transaction) => {
      if (statusFilter.value !== 'all' && transaction.status !== statusFilter.value) return false
      if (paymentFilter.value !== 'all' && transaction.type !== paymentFilter.value) return false
      if (!query) return true

      const haystack = [
        transaction.id,
        transaction.cashier,
        transaction.customerName,
        ...transaction.items.map((item) => item.name),
      ].join(' ').toLowerCase()

      return haystack.includes(query)
    })
  }

  const paginatedTransactions = (branch) => {
    const branchTransactions = filteredTransactions(branch)
    const startIndex = (currentPage.value - 1) * ROWS_PER_PAGE
    return branchTransactions.slice(startIndex, startIndex + ROWS_PER_PAGE)
  }

  const totalPages = (branch) => Math.max(1, Math.ceil(filteredTransactions(branch).length / ROWS_PER_PAGE))

  const branchMetrics = (branch) => {
    const scopedTransactions = periodFilteredTransactions(branch)
    const completedTransactions = scopedTransactions.filter((transaction) => transaction.status !== 'refunded')
    const grossSales = completedTransactions.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0)
    const refunds = scopedTransactions.reduce((sum, transaction) => sum + Number(transaction.refundedAmount || 0), 0)

    return {
      totalSales: grossSales,
      transactions: scopedTransactions.length,
      refunds,
      averageOrder: completedTransactions.length ? Math.round(grossSales / completedTransactions.length) : 0,
    }
  }

  const todaySalesByBranch = (branch) =>
    transactionsForBranch(branch)
      .filter((transaction) => String(transaction.createdAt || '').startsWith(salesReportDate.value))
      .reduce((sum, transaction) => sum + Number(transaction.total || 0), 0)

  const mtdSalesByBranch = (branch) =>
    transactionsForBranch(branch)
      .filter((transaction) => String(transaction.createdAt || '').startsWith(monthKey.value))
      .reduce((sum, transaction) => sum + Number(transaction.total || 0), 0)

  const byBranchAndDate = (branch, from, to) => {
    const branches = branch ? [branch] : Object.keys(transactions.value)
    return branches.flatMap((branchName) =>
      transactionLineRows.value
        .filter((row) => row.branch === branchName && inDateRange(row.date, from, to))
        .map((row, index) => ({
          id: `${row.id}-${index}`,
          branch: branchName,
          date: row.date,
          sku: row.sku,
          qtyKg: row.qtyKg,
          unitPrice: row.unitPrice,
        }))
    )
  }

  const soldQtyByBranchSku = (branch, sku) =>
    transactionLineRows.value
      .filter((row) => row.branch === branch && row.sku === sku)
      .reduce((sum, row) => sum + Number(row.qtyKg || 0), 0)

  return {
    reportDate,
    salesReportDate,
    rowsPerPage: ROWS_PER_PAGE,
    monthKey,
    records,
    activeView,
    creditForm,
    customerForm,
    paymentForm,
    creditModalOpen,
    customerModalOpen,
    paymentModalOpen,
    customerBranch,
    paymentBranch,
    receiptModalOpen,
    activeReceipt,
    searchQuery,
    statusFilter,
    paymentFilter,
    periodFilter,
    currentPage,
    customers,
    loading,
    customerOptions,
    paymentCustomerOptions,
    paymentOutstandingMap,
    payments,
    currentOrderId,
    totalTodaySalesAllBranches,
    initialize,
    setActiveView,
    openCreditModal,
    closeCreditModal,
    openCustomerModal,
    closeCustomerModal,
    openPaymentModal,
    closePaymentModal,
    resetCreditForm,
    resetCustomerForm,
    resetPaymentForm,
    updateCreditField,
    updateCustomerField,
    updatePaymentField,
    selectPaymentCustomer,
    saveCustomer,
    saveReceivedPayment,
    recordCreditPayment,
    saveCreditLedgerEntry,
    deleteCreditLedgerEntry,
    saveCashTransaction,
    saveCreditTransaction,
    closeReceipt,
    openReceiptById,
    openLatestReceipt,
    setSearchQuery,
    setStatusFilter,
    setPaymentFilter,
    setPeriodFilter,
    setPage,
    setSalesReportDate,
    transactionsForBranch,
    filteredTransactions,
    paginatedTransactions,
    totalPages,
    branchMetrics,
    todaySalesByBranch,
    mtdSalesByBranch,
    byBranchAndDate,
    soldQtyByBranchSku,
  }
})




