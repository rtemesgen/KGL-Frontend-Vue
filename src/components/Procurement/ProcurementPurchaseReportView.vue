<template>
  <div class="space-y-2 p-1.5">
    <section class="grid gap-2 md:grid-cols-3">
      <article v-for="card in summaryCards" :key="card.key" class="rounded-[14px] border border-[#d9e4db] bg-[#fcfdf9] p-2 shadow-[0_8px_18px_rgba(40,70,54,0.07)]">
        <div class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">{{ card.label }}</div>
        <div class="mt-1 text-[24px] font-semibold tracking-[-0.05em] text-[#22392e]">{{ card.value }}</div>
        <div class="mt-1 text-[11px] text-[#6b8076]">{{ card.hint }}</div>
      </article>
    </section>

    <section class="overflow-hidden rounded-[14px] border border-[#d9e4db] bg-[#fcfdf9] shadow-[0_8px_18px_rgba(40,70,54,0.07)]">
      <div class="max-h-[420px] overflow-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-[#f6f8f4] text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">
            <tr>
              <th class="border-b border-[#d9e4db] px-3 py-2">Date</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Supplier</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Item ID</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Item Name</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Qty</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Unit Cost</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Selling Price</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Total Cost</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Amount Paid</th>
              <th class="border-b border-[#d9e4db] px-3 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id" class="border-b border-[#e4ebe5] text-[12px] text-[#22392e] even:bg-[#fafcf9]">
              <td class="px-3 py-3 text-[#5c7368]">{{ formatDate(row.createdAt) }}</td>
              <td class="px-3 py-3 font-semibold">{{ row.supplierName }}</td>
              <td class="px-3 py-3 text-[#5c7368]">{{ row.sku }}</td>
              <td class="px-3 py-3">{{ row.name }}</td>
              <td class="px-3 py-3">{{ formatNumber(row.qty) }}</td>
              <td class="px-3 py-3">{{ money(row.costPrice) }}</td>
              <td class="px-3 py-3">{{ money(row.sellingPrice) }}</td>
              <td class="px-3 py-3 font-semibold">{{ money(row.total) }}</td>
              <td class="px-3 py-3 text-[#2f6b4d]">{{ money(row.amountPaid) }}</td>
              <td class="px-3 py-3" :class="row.amountRemaining > 0 ? 'text-[#b42318]' : 'text-[#2f6b4d]'">{{ money(row.amountRemaining) }}</td>
            </tr>
            <tr v-if="!filteredRows.length">
              <td colspan="10" class="px-3 py-6 text-center text-[12px] text-[#6b8076]">No procurement rows match the current filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer class="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-[#6b8076]">
        <span>Showing {{ filteredRows.length }} purchase rows</span>
        <span>{{ props.activeBranch }} branch</span>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, defineExpose } from 'vue'
import { toast } from 'vue3-toastify'
import { useProcurementStore } from '@/stores/procurement'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  activeBranch: { type: String, required: true },
  staffName: { type: String, required: true },
  fromDate: { type: String, default: '' },
  toDate: { type: String, default: '' },
  supplierId: { type: String, default: '' },
  statusFilter: { type: String, default: '' },
  searchQuery: { type: String, default: '' },
})

const procurement = useProcurementStore()

const scopedSummary = computed(() => procurement.purchaseSummaryByBranch(
  props.activeBranch,
  props.fromDate,
  props.toDate,
  props.supplierId,
  props.statusFilter ? [props.statusFilter] : [],
))
const filteredRecords = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()
  if (!query) return scopedSummary.value.records
  return scopedSummary.value.records.filter((record) => {
    const haystack = [record.receiptId, record.supplierName, record.status, ...record.items.map((item) => `${item.name} ${item.sku}`)].join(' ').toLowerCase()
    return haystack.includes(query)
  })
})
const filteredRows = computed(() => filteredRecords.value.flatMap((record) =>
  record.items.map((item) => {
    const ratio = Number(record.total || 0) > 0 ? Number(item.total || 0) / Number(record.total || 1) : 0
    return {
      id: `${record.id}-${item.sku}`,
      receiptId: record.receiptId,
      branch: record.branch,
      createdAt: record.createdAt,
      supplierName: record.supplierName,
      sku: item.sku,
      name: item.name,
      qty: Number(item.qty || 0),
      costPrice: Number(item.costPrice || 0),
      sellingPrice: Number(item.sellingPrice || 0),
      total: Number(item.total || 0),
      amountPaid: Number(record.amountPaid || 0) * ratio,
      amountRemaining: Number(record.amountRemaining || 0) * ratio,
    }
  }),
))
const totals = computed(() => ({
  purchased: filteredRecords.value.reduce((sum, record) => sum + Number(record.total || 0), 0),
  paid: filteredRecords.value.reduce((sum, record) => sum + Number(record.amountPaid || 0), 0),
  outstanding: filteredRecords.value.reduce((sum, record) => sum + Number(record.amountRemaining || 0), 0),
}))
const summaryCards = computed(() => [
  { key: 'purchased', label: 'Total Purchased', value: money(totals.value.purchased), hint: `${filteredRecords.value.length} procurement records` },
  { key: 'paid', label: 'Total Paid', value: money(totals.value.paid), hint: 'Supplier payments recorded' },
  { key: 'outstanding', label: 'Outstanding Balance', value: money(totals.value.outstanding), hint: 'Remaining supplier balance' },
])

const money = (value) => `USh ${formatAmount(value)}`
const formatNumber = (value) => formatAmount(value)
const formatDate = (value) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const exportReport = async () => {
  try {
    await exportReportToPdf({
      title: `Purchase Report - ${props.activeBranch}`,
      filename: `${props.activeBranch}-purchase-report`,
      meta: { Branch: props.activeBranch, Staff: props.staffName, From: props.fromDate || '-', To: props.toDate || '-' },
      orientation: 'landscape',
      columns: [
        { key: 'date', label: 'Date', width: 70 },
        { key: 'supplier', label: 'Supplier', width: 110 },
        { key: 'sku', label: 'Item ID', width: 80 },
        { key: 'item', label: 'Item', width: 110 },
        { key: 'qty', label: 'Qty', width: 50, align: 'right' },
        { key: 'cost', label: 'Unit Cost', width: 80, align: 'right' },
        { key: 'selling', label: 'Selling', width: 80, align: 'right' },
        { key: 'total', label: 'Total', width: 80, align: 'right' },
        { key: 'paid', label: 'Paid', width: 80, align: 'right' },
        { key: 'balance', label: 'Balance', width: 80, align: 'right' },
      ],
      rows: filteredRows.value.map((row) => ({
        date: formatDate(row.createdAt),
        supplier: row.supplierName,
        sku: row.sku,
        item: row.name,
        qty: formatNumber(row.qty),
        cost: money(row.costPrice),
        selling: money(row.sellingPrice),
        total: money(row.total),
        paid: money(row.amountPaid),
        balance: money(row.amountRemaining),
      })),
      totals: {
        Purchased: money(totals.value.purchased),
        Paid: money(totals.value.paid),
        Outstanding: money(totals.value.outstanding),
      },
    })
    toast.success('Purchase report exported.')
  } catch (error) {
    console.error(error)
    toast.error('Unable to export purchase report.')
  }
}

defineExpose({ exportReport })
</script>
