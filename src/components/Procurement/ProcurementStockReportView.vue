<template>
  <div class="grid gap-2 p-1.5 xl:grid-cols-[minmax(0,1.85fr)_240px]">
    <section class="overflow-hidden rounded-[14px] border border-[#d9e4db] bg-[#fcfdf9] shadow-[0_8px_18px_rgba(40,70,54,0.07)]">
      <header class="flex items-center justify-between gap-2 border-b border-[#d9e4db] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-2 py-1.5">
        <h2 class="m-0 text-[15px] font-semibold tracking-[-0.04em] text-[#22392e]">Inventory Records</h2>
        <div class="flex items-center gap-1.5 text-[11px] font-semibold">
                  </div>
      </header>

      <div class="max-h-[420px] overflow-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-[#f6f8f4] text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">
            <tr>
              <th class="border-b border-[#d9e4db] px-3 py-2">Item ID</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Item</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Qty</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Cost</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Total</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Selling Price</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Date/Time</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Last Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in inventoryRows" :key="row.sku" class="border-b border-[#e4ebe5] text-[12px] text-[#22392e] even:bg-[#fafcf9]">
              <td class="px-3 py-3 font-semibold text-[#5c7368]">#{{ row.sku }}</td>
              <td class="px-3 py-3">
                <div class="font-semibold">{{ row.name }}</div>
                <div class="text-[10px] text-[#6b8076]">{{ itemMeta(row) }}</div>
              </td>
              <td class="px-3 py-3">{{ formatNumber(row.qty) }}</td>
              <td class="px-3 py-3">{{ money(row.costPrice) }}</td>
              <td class="px-3 py-3 font-semibold">{{ money(row.qty * row.costPrice) }}</td>
              <td class="px-3 py-3">{{ money(row.sellingPrice) }}</td>
              <td class="px-3 py-3 text-[#5c7368]">{{ row.lastAt ? formatDateTime(row.lastAt) : 'No activity' }}</td>
              <td class="px-3 py-3">
                <span class="rounded-full px-2 py-1 text-[10px] font-semibold" :class="badgeTone(row.lastAction)">{{ row.lastAction || 'Seeded' }}</span>
              </td>
            </tr>
            <tr v-if="!inventoryRows.length">
              <td colspan="8" class="px-3 py-6 text-center text-[12px] text-[#6b8076]">No inventory rows match the current search.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-[#6b8076]">
        <span>Showing {{ inventoryRows.length }} inventory rows</span>
        <span>{{ activeBranch }} branch</span>
      </footer>
    </section>

    <aside class="space-y-2">
      <section class="rounded-[14px] border border-[#d9e4db] bg-[linear-gradient(180deg,#eef4eb,#e8f0ea)] p-2 shadow-[0_8px_18px_rgba(40,70,54,0.07)]">
        <h3 class="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2f6b4d]">Stock Summary</h3>
        <dl class="mt-3 space-y-2 text-[12px] text-[#31463c]">
          <div class="flex items-center justify-between"><dt>Total Items</dt><dd class="font-semibold text-[#0f172a]">{{ stockSummary.totalItems }}</dd></div>
          <div class="flex items-center justify-between"><dt>Inventory Value</dt><dd class="font-semibold text-[#0f172a]">{{ money(stockSummary.inventoryValue) }}</dd></div>
        </dl>
        <div class="mt-4 border-t border-[#d3dfd5] pt-3">
          <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1f6be8]">Estimated Profit</div>
          <div class="mt-1 text-[24px] font-semibold tracking-[-0.05em] text-[#1f6be8]">{{ money(stockSummary.estimatedProfit) }}</div>
        </div>
      </section>
    </aside>

    <ProcurementManageRecordsModal :open="recordsModalOpen" :rows="movementRows" :branch-label="activeBranch" @close="procurement.closeRecordsModal()" @edit="handleRecordEdit" @delete="handleRecordDelete" />
    <ProcurementStockHistoryModal :open="showHistoryModal" :rows="movementRows" :branch-label="activeBranch" @close="showHistoryModal = false" />
  </div>
</template>

<script setup>
import { computed, defineExpose, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import ProcurementManageRecordsModal from '@/components/Procurement/ProcurementManageRecordsModal.vue'
import ProcurementStockHistoryModal from '@/components/Procurement/ProcurementStockHistoryModal.vue'
import { useProcurementStore } from '@/stores/procurement'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  activeBranch: { type: String, required: true },
  staffName: { type: String, required: true },
  searchQuery: { type: String, default: '' },
})

const procurement = useProcurementStore()
const { recordsModalOpen } = storeToRefs(procurement)
const showHistoryModal = ref(false)

const money = (value) => `USh ${formatAmount(value)}`
const formatNumber = (value) => formatAmount(value)
const formatDateTime = (value) => new Date(value).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const itemMeta = (row) => [row.category || 'General', row.unit || 'kg'].filter(Boolean).join(' | ')

const branchItems = computed(() => procurement.catalogItemsByBranch(props.activeBranch))
const movementRows = computed(() => procurement.movementRecordsByBranch(props.activeBranch))
const movementMap = computed(() => {
  const map = {}
  movementRows.value.forEach((row) => {
    if (!map[row.sku]) map[row.sku] = row
  })
  return map
})
const inventoryRows = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()
  return branchItems.value
    .map((item) => ({
      ...item,
      category: String(item.category || 'General').trim(),
      unit: String(item.unit || 'kg').trim(),
      qty: Number(item.qty || 0),
      costPrice: Number(item.costPrice || 0),
      sellingPrice: Number(item.sellingPrice || 0),
      lastAt: movementMap.value[item.sku]?.createdAt || item.updatedAt || '',
      lastAction: movementMap.value[item.sku]?.actionType || '',
    }))
    .filter((item) => !query || `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query))
})
const stockSummary = computed(() => procurement.stockSummaryByBranch(props.activeBranch))

const badgeTone = (value) => value === 'Procurement'
  ? 'bg-[#dce8f8] text-[#1f6be8]'
  : value === 'Adjustment'
    ? 'bg-[#efe1f8] text-[#8b3fe2]'
    : value === 'Damage'
      ? 'bg-[#ffe4df] text-[#dc2626]'
      : 'bg-[#edf4ec] text-[#30543e]'

const notifyUnsupported = (label) => {
  toast.info(`${label} requires an additional backend contract before it can be connected safely.`)
}
const handleRecordEdit = (row) => {
  toast.info(`${row.actionType} record editing is not available from the current backend API.`)
}
const handleRecordDelete = (row) => {
  toast.info(`Deleting ${row.actionType.toLowerCase()} records is not available from the current backend API.`)
}

const exportReport = async () => {
  try {
    await exportReportToPdf({
      title: `Stock Report - ${props.activeBranch}`,
      filename: `${props.activeBranch}-stock-report`,
      meta: { Branch: props.activeBranch, Staff: props.staffName },
      orientation: 'landscape',
      columns: [
        { key: 'sku', label: 'Item ID', width: 85 },
        { key: 'name', label: 'Item', width: 120 },
        { key: 'qty', label: 'Qty', width: 60, align: 'right' },
        { key: 'cost', label: 'Cost', width: 80, align: 'right' },
        { key: 'total', label: 'Total', width: 95, align: 'right' },
        { key: 'selling', label: 'Selling Price', width: 95, align: 'right' },
        { key: 'action', label: 'Last Action', width: 90 },
      ],
      rows: inventoryRows.value.map((row) => ({
        sku: row.sku,
        name: row.name,
        qty: formatNumber(row.qty),
        cost: money(row.costPrice),
        total: money(row.qty * row.costPrice),
        selling: money(row.sellingPrice),
        action: row.lastAction || 'Seeded',
      })),
      totals: {
        'Inventory Value': money(stockSummary.value.inventoryValue),
        'Estimated Profit': money(stockSummary.value.estimatedProfit),
      },
    })
    toast.success('Stock report exported.')
  } catch (error) {
    console.error(error)
    toast.error('Unable to export stock report.')
  }
}

defineExpose({ exportReport })
</script>
