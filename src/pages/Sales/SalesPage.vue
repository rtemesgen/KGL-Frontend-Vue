<template>
  <AppPageShell main-class="no-scrollbar overflow-x-hidden overflow-y-auto p-0">
    <div class="flex flex-col gap-0 bg-transparent">
      <section class="rounded-[12px] border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] px-1.25 py-0.5 shadow-[0_6px_16px_rgba(48,84,62,0.06)]">
        <div class="flex flex-col gap-[3px]">
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5">
              <RouterLink to="/" class="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#9fb8a8] bg-[#30543e] px-2 text-white shadow-[0_8px_18px_rgba(48,84,62,0.18)] transition hover:bg-[#274536]" aria-label="Go to dashboard">
                <HomeIcon class="h-4 w-4" />
                <span class="text-[11px] font-semibold leading-none">Dashboard</span>
              </RouterLink>

              <div>
                <h1 class="m-0 text-[18px] font-semibold tracking-[-0.04em] text-[#111827]">Sales</h1>
                <p class="m-0 text-[9px] text-[#5f7569]">{{ activeBranch }} branch | {{ cashier }}</p>
              </div>
            </div>

            <div class="flex min-w-0 flex-wrap items-center justify-end gap-0.75">
              <input
                :value="salesStore.salesReportDate"
                type="date"
                class="h-7 min-w-[122px] rounded-[8px] border border-[#c7d7cc] bg-[#f8faf7] px-2 text-[9px] text-[#24352f] outline-none"
                @input="salesStore.setSalesReportDate($event.target.value)"
              />
              <input
                v-model="reportSearch"
                type="text"
                placeholder="Search..."
                class="h-7 min-w-[148px] rounded-[8px] border border-[#c7d7cc] bg-[#f8faf7] px-2 text-[9px] text-[#24352f] outline-none"
              />
              <button v-if="activeView === 'report'" class="h-7 rounded-[8px] border border-[#d8decf] bg-[#f6f3e8] px-2.5 text-[9px] font-semibold text-[#355846] transition hover:bg-white" @click="exportSalesPdf">
                Export Sales PDF
              </button>
              <button class="h-7 rounded-[8px] bg-[#3f6b4f] px-2.5 text-[9px] font-semibold text-white transition hover:bg-[#355846]" @click="refreshPage">
                Refresh
              </button>
            </div>
          </div>

          <div class="inline-flex w-fit rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <button
              class="rounded-[7px] px-1.5 py-0.5 text-[9px] font-semibold transition"
              :class="activeView === 'pos' ? 'bg-[#30543e] text-white shadow-[0_4px_10px_rgba(48,84,62,0.12)]' : 'text-[#4f6259] hover:bg-white'"
              @click="salesStore.setActiveView('pos')"
            >
              Sales
            </button>
            <button
              class="rounded-[7px] px-1.5 py-0.5 text-[9px] font-semibold transition"
              :class="activeView === 'report' ? 'bg-[#30543e] text-white shadow-[0_4px_10px_rgba(48,84,62,0.12)]' : 'text-[#4f6259] hover:bg-white'"
              @click="salesStore.setActiveView('report')"
            >
              Daily Sale Report
            </button>
          </div>
        </div>
      </section>

      <section>
        <SalesPosView v-if="activeView === 'pos'" :active-branch="activeBranch" :cashier="cashier" />
        <SalesReportView v-else :active-branch="activeBranch" :report-date="salesStore.salesReportDate" :search="reportSearch" />
      </section>

      <SalesReceiptModal :open="receiptModalOpen" :receipt="activeReceipt" @close="salesStore.closeReceipt()" />
    </div>
  </AppPageShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { HomeIcon } from '@heroicons/vue/24/outline'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import AppPageShell from '@/components/Layout/AppPageShell.vue'
import SalesPosView from '@/components/Sales/SalesPosView.vue'
import SalesReceiptModal from '@/components/Sales/SalesReceiptModal.vue'
import SalesReportView from '@/components/Sales/SalesReportView.vue'
import { useInventoryStore } from '@/stores/inventory'
import { useSalesStore } from '@/stores/sales'
import { useUsersStore } from '@/stores/users'
import { formatAmount } from '@/utils/formatters'
import { exportReportToPdf } from '@/utils/exportPdf'

const inventory = useInventoryStore()
const users = useUsersStore()
const salesStore = useSalesStore()
const { activeView, activeReceipt, receiptModalOpen } = storeToRefs(salesStore)
const reportSearch = ref('')

const activeBranch = computed(() => users.canSwitchBranch ? inventory.activeBranch : (users.assignedBranch || inventory.activeBranch))
const cashier = computed(() => users.currentProfileName)
const filteredTransactions = computed(() => {
  const query = reportSearch.value.trim().toLowerCase()
  return salesStore.transactionsForBranch(activeBranch.value)
    .filter((transaction) => String(transaction.createdAt || '').startsWith(salesStore.salesReportDate))
    .filter((transaction) => {
      if (!query) return true
      const haystack = [transaction.id, transaction.cashier, transaction.customerName, ...transaction.items.map((item) => item.name)].join(' ').toLowerCase()
      return haystack.includes(query)
    })
})
const metrics = computed(() => ({
  totalSales: filteredTransactions.value.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0),
  totalPaid: filteredTransactions.value.reduce((sum, transaction) => sum + Number(transaction.amountPaid || 0), 0),
  balance: filteredTransactions.value.reduce((sum, transaction) => sum + Number(transaction.outstandingAmount || 0), 0),
}))

watch(activeBranch, (branch) => {
  if (!branch) return
  salesStore.initialize(branch, true)
}, { immediate: true })

const money = (value) => `USh ${formatAmount(value)}`
const compactId = (value) => String(value || '').replace('ORD-', '')
const stamp = (value) => {
  const date = new Date(value)
  return `${date.toLocaleDateString('en-GB')}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

const refreshPage = async () => {
  await salesStore.initialize(activeBranch.value, true)
  toast.info(`Sales refreshed for ${activeBranch.value}.`)
}

const exportSalesPdf = async () => {
  await exportReportToPdf({
    title: `Daily Sales Report - ${activeBranch.value}`,
    filename: `${activeBranch.value}-daily-sales-${salesStore.salesReportDate}`,
    meta: {
      Branch: activeBranch.value,
      Date: salesStore.salesReportDate,
    },
    columns: [
      { key: 'saleNo', label: 'Sale No' },
      { key: 'type', label: 'Type' },
      { key: 'customer', label: 'Customer' },
      { key: 'total', label: 'Total', align: 'right', width: 90 },
      { key: 'paid', label: 'Paid', align: 'right', width: 90 },
      { key: 'balance', label: 'Balance', align: 'right', width: 90 },
      { key: 'stamp', label: 'Date/Time', width: 120 },
    ],
    rows: filteredTransactions.value.map((transaction) => ({
      saleNo: compactId(transaction.id),
      type: transaction.type === 'credit' ? 'Credit' : 'Cash',
      customer: transaction.customerName || 'Walk-in Customer',
      total: money(transaction.total),
      paid: money(transaction.amountPaid),
      balance: money(transaction.outstandingAmount),
      stamp: stamp(transaction.createdAt),
    })),
    totals: {
      'Total Sales': money(metrics.value.totalSales),
      'Total Paid': money(metrics.value.totalPaid),
      Balance: money(metrics.value.balance),
    },
  })
  toast.success('Sales PDF downloaded.')
}
</script>

<style scoped>
:global(.no-scrollbar) {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

:global(.no-scrollbar::-webkit-scrollbar) {
  display: none;
}
</style>



