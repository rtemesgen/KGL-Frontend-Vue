import { computed } from 'vue'
import { defineStore } from 'pinia'
import { formatUGX } from '@/utils/formatters'
import { useInventoryStore } from '@/stores/inventory'
import { useSalesStore } from '@/stores/sales'
import { useUsersStore } from '@/stores/users'

const DASHBOARD_APPS = [
  { key: 'sales', label: 'Sales', desc: 'CRM & ORDERS', icon: 'arrow-trending-up', route: '/sales' },
  { key: 'procurement', label: 'Procurement', desc: 'VENDORS & POS', icon: 'shopping-cart', route: '/procurement' },
  { key: 'accounting', label: 'Accounting', desc: 'GENERAL LEDGER', icon: 'building-library', route: '/accounting' },
  { key: 'reports', label: 'Reports', desc: 'BI & INSIGHTS', icon: 'chart-bar', route: '/reports' },
  { key: 'users', label: 'Users', desc: 'PERMISSIONS', icon: 'users', route: '/users' },
]

export const useDashboardStore = defineStore('dashboard', () => {
  const inventory = useInventoryStore()
  const users = useUsersStore()
  const sales = useSalesStore()

  const userName = computed(() => users.currentProfileName)
  const activeBranch = computed(() => (users.canSwitchBranch ? inventory.activeBranch : users.assignedBranch || inventory.activeBranch))

  const summaryCards = computed(() => {
    const cards = []

    if (users.canSwitchBranch) {
      cards.push({
        key: 'net-revenue',
        title: 'NET REVENUE (MTD)',
        value: formatUGX(sales.mtdSalesByBranch(activeBranch.value)),
        icon: 'banknotes',
        trend: 'Live branch sales',
        trendType: 'up',
      })
    }

    cards.push({
      key: 'low-stock',
      title: 'LOW STOCK (< 1000KG)',
      value: `${lowStockRemainingCount.value} Items`,
      icon: 'cube',
      trend: 'Based on remaining stock',
      trendType: 'critical',
    })

    if (users.canSwitchBranch) {
      cards.push({
        key: 'all-branches-sales',
        title: 'TOTAL SALES (ALL BRANCHES)',
        value: formatUGX(sales.totalTodaySalesAllBranches),
        icon: 'search',
        trend: 'Maganjo + Matugga',
        trendType: 'info',
      })
    }

    cards.push({
      key: 'today-sales',
      title: "TODAY'S SALES",
      value: formatUGX(sales.todaySalesByBranch(activeBranch.value)),
      icon: 'calculator',
      trend: 'UGX branch sales',
      trendType: 'up',
    })

    return cards
  })

  const stockRows = computed(() => {
    const branchStock = inventory.branches[activeBranch.value]?.stock || []

    return branchStock.map((item) => {
      const remainingQty = Number(item.qtyKg || 0)
      const soldQty = Number(sales.soldQtyByBranchSku(activeBranch.value, item.sku) || 0)
      const openingQty = remainingQty + soldQty
      const status = remainingQty === 0 ? 'Out of Stock' : remainingQty < 1000 ? 'Low Stock' : 'In Stock'

      return {
        ...item,
        openingQty,
        soldQty,
        remainingQty,
        status,
      }
    })
  })

  const lowStockRemainingCount = computed(() => stockRows.value.filter((item) => item.remainingQty < 1000).length)
  const isAppAllowed = (key) => users.allowedCardKeys.includes(key)

  return {
    apps: DASHBOARD_APPS,
    userName,
    activeBranch,
    summaryCards,
    stockRows,
    lowStockRemainingCount,
    isAppAllowed,
  }
})
