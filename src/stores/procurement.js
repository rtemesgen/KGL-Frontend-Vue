import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { inDateRange } from '@/utils/date'
import { useInventoryStore } from '@/stores/inventory'
import { procurementApiService } from '@/services/api/procurement'

const normalizeMoney = (value) => Math.max(Number(value || 0), 0)
const normalizeQty = (value) => Math.max(Number(value || 0), 0)

const frontendBranch = (branch) => {
  const value = String(branch || '').trim().toLowerCase()
  if (value === 'maganjo') return 'Maganjo'
  if (value === 'matugga') return 'Matugga'
  return branch || 'Maganjo'
}

const syncStatus = (record) => {
  const remaining = Math.max(Number(record.amountRemaining || 0), 0)
  const paid = Math.max(Number(record.amountPaid || 0), 0)
  record.amountRemaining = remaining
  record.amountPaid = paid
  record.status = remaining <= 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid')
  return record
}

const mapSupplier = (supplier = {}) => ({
  id: supplier._id || supplier.id || '',
  branch: frontendBranch(supplier.branch),
  name: String(supplier.name || '').trim(),
  contactName: String(supplier.contactName || '').trim(),
  email: String(supplier.email || '').trim(),
  phone: String(supplier.phone || '').trim(),
  address: String(supplier.address || '').trim(),
  status: String(supplier.status || 'Active').trim() || 'Active',
  terms: String(supplier.terms || 'NET 30').trim() || 'NET 30',
  openingBalance: normalizeMoney(supplier.openingBalance),
  balance: normalizeMoney(supplier.balance),
  createdAt: supplier.createdAt || '',
  updatedAt: supplier.updatedAt || '',
})

const mapPurchaseLine = (line = {}) => ({
  itemId: line.item || line.itemId || '',
  sku: String(line.sku || '').trim(),
  name: String(line.itemName || line.name || '').trim(),
  qty: normalizeQty(line.quantity || line.qty),
  costPrice: normalizeMoney(line.unitCost || line.costPrice),
  sellingPrice: normalizeMoney(line.sellingPrice),
  total: normalizeMoney(line.lineTotal || line.total),
  category: String(line.category || '').trim(),
  unit: String(line.unit || 'kg').trim() || 'kg',
  minQty: normalizeQty(line.minQty),
})

const mapPurchase = (record = {}) => syncStatus({
  id: record._id || record.id || '',
  receiptId: String(record.purchaseNo || record.receiptId || '').trim(),
  branch: frontendBranch(record.branch),
  supplierId: record?.supplier?._id || record.supplier || '',
  supplierName: String(record.supplierName || record?.supplier?.name || '').trim(),
  createdAt: record.purchaseDate || record.createdAt || '',
  createdBy: String(record.createdByName || record.createdBy || 'System').trim(),
  amountPaid: normalizeMoney(record.amountPaid),
  total: normalizeMoney(record.totalAmount || record.total),
  amountRemaining: normalizeMoney(record.balanceDue || record.amountRemaining),
  discount: normalizeMoney(record.discount),
  note: String(record.note || '').trim(),
  paymentType: String(record.paymentType || '').trim().toLowerCase(),
  items: Array.isArray(record.lines) ? record.lines.map(mapPurchaseLine) : [],
})

const mapReceipt = (receipt = {}) => ({
  id: receipt._id || receipt.id || '',
  branch: frontendBranch(receipt.branch),
  supplierId: receipt?.supplier?._id || receipt.supplier || '',
  supplierName: String(receipt?.supplier?.name || receipt.supplierName || '').trim(),
  amount: normalizeMoney(receipt.amount),
  paymentMethod: String(receipt.paymentMethod || '').trim(),
  reference: String(receipt.reference || '').trim(),
  note: String(receipt.note || '').trim(),
  createdBy: String(receipt.createdByName || receipt.createdBy || 'System').trim(),
  createdAt: receipt.paymentDate || receipt.createdAt || '',
  allocations: receipt.reference ? [{ receiptId: receipt.reference, amount: normalizeMoney(receipt.amount) }] : [],
})

const supplierPayloadFromForm = (payload = {}) => ({
  name: String(payload.name || '').trim(),
  phone: String(payload.phone || '').trim(),
  email: String(payload.email || '').trim(),
  address: String(payload.address || '').trim(),
  openingBalance: normalizeMoney(payload.openingBalance),
})

const itemPayloadFromForm = (payload = {}) => {
  const name = String(payload.name || '').trim()
  const generatedSku = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16)
  const normalizedSku = String(payload.sku || '').trim() || generatedSku || `ITEM-${Date.now()}`

  return {
    name,
    sku: normalizedSku,
    category: String(payload.category || 'general').trim().toLowerCase(),
    minQty: normalizeQty(payload.minQty),
    unitCost: normalizeMoney(payload.costPrice),
    sellingPrice: normalizeMoney(payload.sellingPrice),
    note: String(payload.note || '').trim(),
  }
}

export const useProcurementStore = defineStore('procurement', () => {
  const inventory = useInventoryStore()

  const suppliers = ref([])
  const purchaseRecords = ref([])
  const supplierPayments = ref([])
  const overview = ref(null)
  const stockReportSummary = ref(null)
  const initializedBranch = ref('')
  const loading = ref(false)
  const receiptModalOpen = ref(false)
  const activeReceipt = ref(null)
  const supplierManagerOpen = ref(false)
  const itemModalOpen = ref(false)
  const recordsModalOpen = ref(false)

  const movementRecords = computed(() => (
    purchaseRecords.value
      .flatMap((record, index) => record.items.map((item, itemIndex) => ({
        id: `PUR-${record.id}-${item.sku || itemIndex}`,
        sourceType: 'purchase',
        sourceId: record.id,
        branch: record.branch,
        sku: item.sku,
        itemName: item.name,
        actionType: 'Procurement',
        qtyDelta: item.qty,
        createdAt: record.createdAt,
        staffName: record.createdBy || 'System',
        sortKey: `${record.createdAt}-${index}-${itemIndex}`,
      })))
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  ))

  const loadOverview = async () => {
    overview.value = await procurementApiService.getOverview()
    return overview.value
  }

  const loadSuppliers = async () => {
    const { suppliers: rows } = await procurementApiService.listSuppliers({ limit: 1000 })
    suppliers.value = rows.map(mapSupplier)
    return suppliers.value
  }

  const loadPurchases = async (params = {}) => {
    const { purchases } = await procurementApiService.listPurchases({ limit: 1000, ...params })
    purchaseRecords.value = purchases.map(mapPurchase).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    return purchaseRecords.value
  }

  const loadReceipts = async () => {
    const receipts = await procurementApiService.listReceipts()
    supplierPayments.value = receipts.map(mapReceipt).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    return supplierPayments.value
  }

  const loadStockReport = async () => {
    const report = await procurementApiService.getStockReport()
    stockReportSummary.value = report?.summary || null
    return stockReportSummary.value
  }

  const initialize = async (branch, force = false) => {
    if (!branch) return false
    if (initializedBranch.value === branch && !force) return true
    loading.value = true
    try {
      await Promise.all([
        inventory.loadBranchStock(branch, force),
        loadOverview(),
        loadSuppliers(),
        loadPurchases(),
        loadReceipts(),
        loadStockReport(),
      ])
      initializedBranch.value = branch
      return true
    } finally {
      loading.value = false
    }
  }

  const refreshBranchData = async (branch) => {
    await Promise.all([
      inventory.loadBranchStock(branch, true),
      loadOverview(),
      loadSuppliers(),
      loadPurchases(),
      loadReceipts(),
      loadStockReport(),
    ])
    initializedBranch.value = branch
  }

  const suppliersByBranch = (branch) => suppliers.value.filter((supplier) => !branch || supplier.branch === branch)
  const purchaseRecordsByBranch = (branch) => purchaseRecords.value.filter((record) => !branch || record.branch === branch)
  const movementRecordsByBranch = (branch) => movementRecords.value.filter((record) => !branch || record.branch === branch)
  const supplierPaymentsByBranch = (branch) => supplierPayments.value.filter((payment) => !branch || payment.branch === branch)
  const purchaseRecordById = (id) => purchaseRecords.value.find((record) => String(record.id) === String(id)) || null
  const movementRecordById = (id) => movementRecords.value.find((record) => String(record.id) === String(id)) || null

  const catalogItemsByBranch = (branch) => (inventory.branches[branch]?.stock || []).map((item) => ({
    ...item,
    qty: Number(item.qtyKg || 0),
    costPrice: Number(item.costPerKg || 0),
    sellingPrice: Number(item.sellingPricePerKg || 0),
  }))

  const supplierOutstandingByBranch = (branch) => Object.fromEntries(
    suppliersByBranch(branch).map((supplier) => [supplier.id, normalizeMoney(supplier.balance)]),
  )

  const supplierOutstanding = (branch, supplierId) => Number(supplierOutstandingByBranch(branch)[supplierId] || 0)

  const purchaseSummaryByBranch = (branch, from = '', to = '', supplierId = '', statuses = []) => {
    const scoped = purchaseRecordsByBranch(branch).filter((record) => {
      const day = String(record.createdAt || '').slice(0, 10)
      const matchesDate = inDateRange(day, from || '', to || '')
      const matchesSupplier = !supplierId || record.supplierId === supplierId
      const matchesStatus = !statuses?.length || statuses.includes(record.status)
      return matchesDate && matchesSupplier && matchesStatus
    })

    const rows = scoped.flatMap((record) => record.items.map((item) => ({
      id: `${record.id}-${item.sku || item.itemId}`,
      purchaseId: record.id,
      receiptId: record.receiptId,
      branch: record.branch,
      date: String(record.createdAt || '').slice(0, 10),
      createdAt: record.createdAt,
      supplierId: record.supplierId,
      supplierName: record.supplierName,
      status: record.status,
      amountPaid: record.total > 0 ? Number(record.amountPaid || 0) * (Number(item.total || 0) / Number(record.total || 1)) : 0,
      amountRemaining: record.total > 0 ? Number(record.amountRemaining || 0) * (Number(item.total || 0) / Number(record.total || 1)) : 0,
      ...item,
    })))

    return {
      records: scoped,
      rows,
      totalPurchased: scoped.reduce((sum, record) => sum + Number(record.total || 0), 0),
      totalPaid: scoped.reduce((sum, record) => sum + Number(record.amountPaid || 0), 0),
      outstanding: scoped.reduce((sum, record) => sum + Number(record.amountRemaining || 0), 0),
    }
  }

  const stockSummaryByBranch = (branch) => {
    const items = catalogItemsByBranch(branch)
    const totalItems = stockReportSummary.value?.totalItems ?? items.length
    const inventoryValue = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.costPrice || 0)), 0)
    const estimatedProfit = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Math.max(Number(item.sellingPrice || 0) - Number(item.costPrice || 0), 0)), 0)
    return { totalItems, inventoryValue, estimatedProfit }
  }

  const saveSupplier = async (payload = {}) => {
    const clean = supplierPayloadFromForm(payload)
    if (!clean.name) return null
    if (payload.id) await procurementApiService.updateSupplier(payload.id, clean)
    else await procurementApiService.createSupplier(clean)
    await loadSuppliers()
    await loadOverview()
    return suppliers.value.find((supplier) => supplier.id === payload.id) || suppliers.value.find((supplier) => supplier.name === clean.name) || null
  }

  const deleteSupplier = async (id) => {
    if (!id) return null
    await procurementApiService.deleteSupplier(id)
    await Promise.all([loadSuppliers(), loadOverview(), loadPurchases(), loadReceipts()])
    return id
  }

  const saveCatalogItem = async (branch, payload = {}) => {
    const clean = itemPayloadFromForm(payload)
    if (!clean.name) return null
    await procurementApiService.createItem(clean)
    await Promise.all([inventory.loadBranchStock(branch, true), loadOverview(), loadStockReport()])
    return inventory.branches[branch]?.stock?.find((item) => item.name === clean.name) || null
  }

  const savePurchase = async ({ branch, supplierId, items = [], amountPaid = 0 } = {}) => {
    const supplier = suppliers.value.find((entry) => entry.id === supplierId && entry.branch === branch)
    if (!branch || !supplier || !items.length) return null

    const lines = items.map((item) => {
      const stockItem = inventory.findStockItem(branch, item.sku)
      return {
        itemId: stockItem?.backendId,
        quantity: normalizeQty(item.qty),
        unitCost: normalizeMoney(item.costPrice),
        sellingPrice: normalizeMoney(item.sellingPrice),
      }
    }).filter((line) => line.itemId && line.quantity > 0)

    if (!lines.length || lines.length !== items.length) return null

    const totalAmount = items.reduce((sum, item) => sum + (normalizeQty(item.qty) * normalizeMoney(item.costPrice)), 0)
    const paidAmount = Math.min(normalizeMoney(amountPaid), totalAmount)
    const paymentType = paidAmount >= totalAmount ? 'cash' : 'credit'

    const result = await procurementApiService.createPurchase({
      supplierId,
      paymentType,
      lines,
      amountPaid: paidAmount,
      paymentMethod: 'cash',
      note: '',
      purchaseDate: new Date(),
    })

    await refreshBranchData(branch)

    const createdId = result?.purchase?._id || result?.purchaseId || result?.id || ''
    const record = createdId
      ? purchaseRecordById(createdId)
      : purchaseRecords.value.find((entry) => entry.supplierId === supplierId && Math.abs(Number(entry.total || 0) - totalAmount) < 0.001)

    activeReceipt.value = record || null
    receiptModalOpen.value = Boolean(activeReceipt.value)
    return activeReceipt.value
  }

  const saveSupplierPayment = async ({ branch, supplierId, amount = 0, note = '' } = {}) => {
    const supplier = suppliers.value.find((entry) => entry.id === supplierId && entry.branch === branch)
    const paymentAmount = normalizeMoney(amount)
    if (!supplier || paymentAmount <= 0) return null

    const result = await procurementApiService.recordSupplierPaymentAction(supplierId, {
      amount: paymentAmount,
      paymentMethod: 'cash',
      note,
      paymentDate: new Date(),
    })

    await Promise.all([loadSuppliers(), loadPurchases(), loadReceipts(), loadOverview()])

    return result || supplierPayments.value[0] || null
  }

  const openSupplierManager = () => { supplierManagerOpen.value = true }
  const closeSupplierManager = () => { supplierManagerOpen.value = false }
  const openItemModal = () => { itemModalOpen.value = true }
  const closeItemModal = () => { itemModalOpen.value = false }
  const openRecordsModal = () => { recordsModalOpen.value = true }
  const closeRecordsModal = () => { recordsModalOpen.value = false }
  const closeReceipt = () => { receiptModalOpen.value = false; activeReceipt.value = null }

  return {
    suppliers,
    purchaseRecords,
    movementRecords,
    supplierPayments,
    overview,
    stockReportSummary,
    initializedBranch,
    loading,
    receiptModalOpen,
    activeReceipt,
    supplierManagerOpen,
    itemModalOpen,
    recordsModalOpen,
    initialize,
    refreshBranchData,
    suppliersByBranch,
    purchaseRecordsByBranch,
    movementRecordsByBranch,
    supplierPaymentsByBranch,
    purchaseRecordById,
    movementRecordById,
    catalogItemsByBranch,
    supplierOutstandingByBranch,
    supplierOutstanding,
    purchaseSummaryByBranch,
    stockSummaryByBranch,
    saveSupplier,
    deleteSupplier,
    saveCatalogItem,
    savePurchase,
    saveSupplierPayment,
    openSupplierManager,
    closeSupplierManager,
    openItemModal,
    closeItemModal,
    openRecordsModal,
    closeRecordsModal,
    closeReceipt,
  }
})
