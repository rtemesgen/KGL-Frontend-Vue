import { defineStore } from 'pinia'
import { useUsersStore } from '@/stores/users'
import { procurementApiService } from '@/services/api/procurement'

const normalizeQty = (value) => Math.max(Number(value ?? 0), 0)
const normalizeMoney = (value) => Math.max(Number(value ?? 0), 0)
const nextSkuFromName = (name, stock = []) => {
  const compact = String(name || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')
  const base = compact.slice(0, 10) || 'ITEM'
  let attempt = `${base}-01`
  let index = 1
  const used = new Set(stock.map((item) => String(item.sku || '').toUpperCase()))
  while (used.has(attempt)) {
    index += 1
    attempt = `${base}-${String(index).padStart(2, '0')}`
  }
  return attempt
}

const makeStockItem = (item = {}) => ({
  backendId: item.backendId || item._id || '',
  name: String(item.name || '').trim(),
  sku: String(item.sku || '').trim(),
  qtyKg: normalizeQty(item.qtyKg ?? item.quantityOnHand),
  costPerKg: normalizeMoney(item.costPerKg ?? item.unitCost),
  sellingPricePerKg: normalizeMoney(item.sellingPricePerKg ?? item.sellingPrice),
  category: String(item.category || 'General').trim(),
  unit: String(item.unit || 'kg').trim(),
  minQty: normalizeQty(item.minQty),
  note: String(item.note || '').trim(),
  updatedAt: item.updatedAt || item.createdAt || '',
})

const seedBranches = () => ({
  Maganjo: { stock: [] },
  Matugga: { stock: [] },
})

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    activeBranch: 'Maganjo',
    branches: seedBranches(),
    backendHydratedAt: {},
    loadingBranchStock: false,
  }),

  getters: {
    currentBranchData: (state) => state.branches[state.activeBranch],

    stockItems() {
      return this.currentBranchData.stock.map((item) => {
        const qty = normalizeQty(item.qtyKg)
        const lowLimit = normalizeQty(item.minQty || 1000)
        const status = qty === 0 ? 'Out of Stock' : qty < lowLimit ? 'Low Stock' : 'In Stock'
        return {
          ...item,
          qtyKg: qty,
          costPerKg: Number(item.costPerKg ?? 0),
          sellingPricePerKg: Number(item.sellingPricePerKg ?? 0),
          minQty: lowLimit,
          status,
        }
      })
    },

    totalStockKg() {
      return this.currentBranchData.stock.reduce((sum, item) => sum + normalizeQty(item.qtyKg), 0)
    },

    lowStockCount() {
      return this.currentBranchData.stock.filter((item) => normalizeQty(item.qtyKg) < normalizeQty(item.minQty || 1000)).length
    },
  },

  actions: {
    toggleBranch() {
      this.activeBranch = this.activeBranch === 'Maganjo' ? 'Matugga' : 'Maganjo'
    },

    ensureBranch(branchName) {
      if (!this.branches[branchName]) {
        this.branches[branchName] = { stock: [] }
      }
      return this.branches[branchName]
    },

    normalizeBackendBranch(branchName) {
      if (String(branchName || '').trim().toLowerCase() === 'maganjo') return 'Maganjo'
      if (String(branchName || '').trim().toLowerCase() === 'matugga') return 'Matugga'
      return branchName || this.activeBranch
    },

    replaceBranchStock(branchName, items = []) {
      const branch = this.ensureBranch(branchName)
      branch.stock = items.map((item) => makeStockItem(item))
      this.backendHydratedAt[branchName] = Date.now()
      return branch.stock
    },

    async loadBranchStock(branchName = '', force = false) {
      const users = useUsersStore()
      const backendBranch = users.assignedBranch || this.activeBranch
      const targetBranch = this.normalizeBackendBranch(branchName || backendBranch)

      if (targetBranch !== backendBranch && !force) {
        return this.branches[targetBranch]?.stock || []
      }

      if (this.backendHydratedAt[targetBranch] && !force) {
        return this.branches[targetBranch]?.stock || []
      }

      this.loadingBranchStock = true
      try {
        const { items } = await procurementApiService.listItems({ limit: 1000 })
        return this.replaceBranchStock(targetBranch, items)
      } finally {
        this.loadingBranchStock = false
      }
    },

    findStockItem(branchName, sku) {
      return this.branches[branchName]?.stock?.find((item) => item.sku === sku) || null
    },

    addOrUpdateItem(branchName, payload = {}) {
      const branch = this.ensureBranch(branchName)
      const name = String(payload.name || '').trim()
      if (!name) return null

      const sku = String(payload.sku || '').trim() || nextSkuFromName(name, branch.stock)
      const existing = branch.stock.find((item) => item.sku === sku)
      const nextItem = makeStockItem({
        ...existing,
        ...payload,
        name,
        sku,
        qtyKg: normalizeQty(existing?.qtyKg) + normalizeQty(payload.qtyKg),
      })

      if (existing) {
        Object.assign(existing, nextItem)
        return existing
      }

      branch.stock.unshift(nextItem)
      return nextItem
    },

    updateItemDetails(branchName, payload = {}) {
      const branch = this.ensureBranch(branchName)
      const sku = String(payload.sku || '').trim()
      if (!sku) return null
      const item = branch.stock.find((entry) => entry.sku === sku)
      if (!item) return null
      Object.assign(item, {
        ...item,
        name: String(payload.name || item.name).trim(),
        category: String(payload.category || item.category || 'General').trim(),
        unit: String(payload.unit || item.unit || 'kg').trim(),
        minQty: normalizeQty(payload.minQty ?? item.minQty),
        costPerKg: normalizeMoney(payload.costPerKg ?? item.costPerKg),
        sellingPricePerKg: normalizeMoney(payload.sellingPricePerKg ?? item.sellingPricePerKg),
      })
      return item
    },

    receiveStock(branchName, purchasedItems = []) {
      if (!Array.isArray(purchasedItems)) return
      purchasedItems.forEach((item) => {
        this.addOrUpdateItem(branchName, {
          backendId: item.backendId,
          sku: item.sku,
          name: item.name,
          qtyKg: item.qty,
          costPerKg: item.costPrice,
          sellingPricePerKg: item.sellingPrice,
          category: item.category,
          unit: item.unit,
          minQty: item.minQty,
        })
      })
    },

    setStockCount(branchName, sku, qty) {
      const item = this.findStockItem(branchName, sku)
      if (!item) return null
      item.qtyKg = normalizeQty(qty)
      return item
    },

    deductStock(branchName, soldItems = []) {
      const branch = this.branches[branchName]
      if (!branch?.stock?.length || !Array.isArray(soldItems)) return

      soldItems.forEach((soldItem) => {
        const stockItem = branch.stock.find((item) => item.sku === soldItem.sku)
        if (!stockItem) return
        const nextQty = normalizeQty(stockItem.qtyKg) - normalizeQty(soldItem.qty)
        stockItem.qtyKg = Math.max(nextQty, 0)
      })
    },
  },
})



