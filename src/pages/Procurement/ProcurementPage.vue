<template>
  <AppPageShell main-class="no-scrollbar overflow-x-hidden overflow-y-auto p-0">
    <div class="flex flex-col gap-0 bg-transparent">
      <section class="rounded-[12px] border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] px-1.5 py-1 shadow-[0_6px_16px_rgba(48,84,62,0.06)]">
        <div class="flex flex-col gap-[3px]">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <RouterLink to="/" class="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#9fb8a8] bg-[#30543e] px-2 text-white shadow-[0_8px_18px_rgba(48,84,62,0.18)] transition hover:bg-[#274536]" aria-label="Go to dashboard">
                <HomeIcon class="h-4 w-4" />
                <span class="text-[12px] font-semibold leading-none">Dashboard</span>
              </RouterLink>

              <div>
                <h1 class="m-0 text-[18px] font-semibold tracking-[-0.04em] text-[#111827]">Procurement</h1>
                <p class="m-0 text-[10px] text-[#5f7569]">{{ activeBranch }} branch | {{ staffName }}</p>
              </div>
            </div>

            <div v-if="showHeaderFilters" class="flex flex-wrap items-center justify-end gap-1">
              <template v-if="activeTab === 'suppliers'">
                <input :value="supplierSearch" type="text" placeholder="Search suppliers..." class="h-9 min-w-[250px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-[11px] text-[#22392e] outline-none" @input="supplierSearch = $event.target.value" />
              </template>

              <template v-else-if="activeTab === 'stock'">
                <input :value="stockSearch" type="text" placeholder="Search items..." class="h-9 min-w-[250px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-[11px] text-[#22392e] outline-none" @input="stockSearch = $event.target.value" />
                <button class="h-9 rounded-[10px] bg-[#2f6b4d] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(48,84,62,0.16)] transition hover:bg-[#27593f]" @click="exportStock">Export PDF</button>
              </template>

              <template v-else-if="activeTab === 'purchase-report'">
                <input v-model="purchaseFromDate" type="date" class="h-8 rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-[11px] text-[#22392e] outline-none" />
                <input v-model="purchaseToDate" type="date" class="h-8 rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-[11px] text-[#22392e] outline-none" />
                <select v-model="purchaseSupplierId" class="h-9 rounded-[10px] border border-[#c7d7cc] bg-white px-3 text-[12px] text-[#22392e] outline-none">
                  <option value="">All Suppliers</option>
                  <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
                </select>
                <select v-model="purchaseStatus" class="h-9 rounded-[10px] border border-[#c7d7cc] bg-white px-3 text-[12px] text-[#22392e] outline-none">
                  <option value="">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
                <input v-model="purchaseSearch" type="text" placeholder="Search purchases..." class="h-8 min-w-[180px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-[11px] text-[#22392e] outline-none" />
                <button class="h-9 rounded-[10px] bg-[#2f6b4d] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(48,84,62,0.16)] transition hover:bg-[#27593f]" @click="exportPurchase">Export PDF</button>
              </template>
            </div>
          </div>

          <div class="inline-flex w-fit items-center gap-1 rounded-[11px] border border-[#bfcfbe] bg-[#f7faf7] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <button class="h-7 rounded-[8px] border border-[#c7d7cc] bg-[#f8faf7] px-2 text-[10px] font-semibold text-[#355846] transition hover:bg-white" @click="refreshPage">Refresh</button>
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="rounded-[8px] px-2 py-1 text-[9px] font-semibold transition"
              :class="activeTab === tab.key ? 'bg-[#30543e] text-white shadow-[0_6px_14px_rgba(48,84,62,0.18)]' : 'text-[#42584e] hover:bg-white hover:text-[#22392e]'"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </section>

      <section>
        <ProcurementPurchaseView v-if="activeTab === 'procurement'" :active-branch="activeBranch" :staff-name="staffName" />
        <ProcurementSuppliersView v-else-if="activeTab === 'suppliers'" :active-branch="activeBranch" :staff-name="staffName" :search-query="supplierSearch" @update-search="supplierSearch = $event" />
        <ProcurementStockReportView ref="stockViewRef" v-else-if="activeTab === 'stock'" :active-branch="activeBranch" :staff-name="staffName" :search-query="stockSearch" />
        <ProcurementPurchaseReportView ref="purchaseReportRef" v-else :active-branch="activeBranch" :staff-name="staffName" :from-date="purchaseFromDate" :to-date="purchaseToDate" :supplier-id="purchaseSupplierId" :status-filter="purchaseStatus" :search-query="purchaseSearch" />
      </section>
    </div>
  </AppPageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import { HomeIcon } from '@heroicons/vue/24/outline'
import { RouterLink } from 'vue-router'
import AppPageShell from '@/components/Layout/AppPageShell.vue'
import ProcurementPurchaseReportView from '@/components/Procurement/ProcurementPurchaseReportView.vue'
import ProcurementPurchaseView from '@/components/Procurement/ProcurementPurchaseView.vue'
import ProcurementStockReportView from '@/components/Procurement/ProcurementStockReportView.vue'
import ProcurementSuppliersView from '@/components/Procurement/ProcurementSuppliersView.vue'
import { useInventoryStore } from '@/stores/inventory'
import { useProcurementStore } from '@/stores/procurement'
import { useUsersStore } from '@/stores/users'

const inventory = useInventoryStore()
const procurement = useProcurementStore()
const users = useUsersStore()
const now = new Date()
const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const activeTab = ref('procurement')
const stockViewRef = ref(null)
const purchaseReportRef = ref(null)
const stockSearch = ref('')
const supplierSearch = ref('')
const purchaseFromDate = ref(monthStart)
const purchaseToDate = ref(today)
const purchaseSupplierId = ref('')
const purchaseStatus = ref('')
const purchaseSearch = ref('')

const tabs = [
  { key: 'procurement', label: 'Procurement' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'stock', label: 'Stock Report' },
  { key: 'purchase-report', label: 'Purchase Report' },
]

const activeBranch = computed(() => users.canSwitchBranch ? inventory.activeBranch : (users.assignedBranch || inventory.activeBranch))
const staffName = computed(() => users.currentProfileName)
const suppliers = computed(() => procurement.suppliersByBranch(activeBranch.value))
const showHeaderFilters = computed(() => activeTab.value !== 'procurement')

const initializeProcurement = async (force = false) => {
  if (!activeBranch.value) return
  try {
    await procurement.initialize(activeBranch.value, force)
  } catch (error) {
    console.error(error)
    toast.error('Unable to load procurement data from the backend.')
  }
}

const refreshPage = async () => {
  await initializeProcurement(true)
  toast.info('Procurement refreshed from backend.')
}

onMounted(() => {
  initializeProcurement()
})

watch(activeBranch, async (nextBranch, previousBranch) => {
  if (!nextBranch || nextBranch === previousBranch) return
  await initializeProcurement(true)
})

const exportStock = async () => {
  if (!stockViewRef.value?.exportReport) {
    toast.error('Stock export is not available right now.')
    return
  }
  await stockViewRef.value.exportReport()
}
const exportPurchase = async () => {
  if (!purchaseReportRef.value?.exportReport) {
    toast.error('Purchase export is not available right now.')
    return
  }
  await purchaseReportRef.value.exportReport()
}
</script>