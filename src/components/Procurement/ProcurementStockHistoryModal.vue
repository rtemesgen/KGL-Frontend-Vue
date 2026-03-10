<template>
  <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-[980px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div>
          <h3 class="m-0 text-[16px] font-semibold text-[#0f172a]">Stock History</h3>
          <p class="m-0 text-[11px] text-[#64748b]">Track who changed what in {{ branchLabel }} stock records.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="h-[34px] rounded-[10px] bg-[#2f6b4d] px-3 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(48,84,62,0.16)] transition hover:bg-[#27593f]" @click="exportHistory">Export</button>
          <button class="h-[34px] rounded-[10px] border border-[#d8decf] bg-white px-4 text-[11px] font-semibold text-[#475569]" @click="$emit('close')">Done</button>
        </div>
      </header>
      <div class="border-b border-[#d8decf] bg-[#fcfdf9] px-4 py-3">
        <div class="grid gap-2 md:grid-cols-[140px_140px_minmax(0,1fr)_180px]">
          <input v-model="fromDate" type="date" class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] text-[#0f172a] outline-none" />
          <input v-model="toDate" type="date" class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] text-[#0f172a] outline-none" />
          <input v-model="search" type="text" placeholder="Search item, record, or staff..." class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] text-[#0f172a] outline-none" />
          <select v-model="typeFilter" class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] text-[#0f172a] outline-none">
            <option value="">All Actions</option>
            <option value="Procurement">Procurement</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Damage">Damage</option>
          </select>
        </div>
      </div>
      <div class="max-h-[420px] overflow-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-[#eef1e6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a7f67]">
            <tr>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Record ID</th>
              <th class="px-3 py-2">Item</th>
              <th class="px-3 py-2">Action</th>
              <th class="px-3 py-2">Qty Delta</th>
              <th class="px-3 py-2">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a] odd:bg-white even:bg-[#fafcf9]">
              <td class="px-3 py-2.5 text-[#64748b]">{{ formatDateTime(row.createdAt) }}</td>
              <td class="px-3 py-2.5 font-semibold text-[#1f6be8]">#{{ row.id }}</td>
              <td class="px-3 py-2.5">
                <div class="font-semibold">{{ row.itemName }}</div>
                <div class="text-[10px] text-[#64748b]">{{ row.sku }}</div>
              </td>
              <td class="px-3 py-2.5"><span class="rounded-full px-2 py-1 text-[10px] font-semibold" :class="badgeTone(row.actionType)">{{ row.actionType }}</span></td>
              <td class="px-3 py-2.5 font-semibold" :class="Number(row.qtyDelta || 0) < 0 ? 'text-[#dc2626]' : 'text-[#2f6b4d]'">{{ Number(row.qtyDelta || 0) > 0 ? '+' : '' }}{{ row.qtyDelta }}</td>
              <td class="px-3 py-2.5">{{ row.staffName }}</td>
            </tr>
            <tr v-if="!filteredRows.length">
              <td colspan="6" class="px-3 py-5 text-center text-[11px] text-[#64748b]">No stock history records match the current filter.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { exportReportToPdf } from '@/utils/exportPdf'

const props = defineProps({
  open: Boolean,
  rows: { type: Array, default: () => [] },
  branchLabel: { type: String, default: '' },
})

defineEmits(['close'])

const search = ref('')
const typeFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()
  return props.rows.filter((row) => {
    const matchesType = !typeFilter.value || row.actionType === typeFilter.value
    const rowDate = String(row.createdAt || '').slice(0, 10)
    const matchesFrom = !fromDate.value || rowDate >= fromDate.value
    const matchesTo = !toDate.value || rowDate <= toDate.value
    const haystack = `${row.id} ${row.itemName} ${row.sku} ${row.staffName} ${row.actionType}`.toLowerCase()
    return matchesType && matchesFrom && matchesTo && (!query || haystack.includes(query))
  })
})

const formatDateTime = (value) => new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
//const badgeTone = (value) => value === 'Procurement' ? 'bg-[#dce8f8] text-[#1f6be8]' : value === 'Adjustment' ? 'bg-[#efe1f8] text-[#8b3fe2]' : 'bg-[#ffe4df] text-[#dc2626]'

const exportHistory = async () => {
  try {
    await exportReportToPdf({
    title: `Stock History - ${props.branchLabel}`,
    filename: `${props.branchLabel}-stock-history`,
    orientation: 'landscape',
    meta: { Branch: props.branchLabel },
    columns: [
      { key: 'date', label: 'Date', width: 100 },
      { key: 'recordId', label: 'Record ID', width: 90 },
      { key: 'item', label: 'Item', width: 160 },
      { key: 'action', label: 'Action', width: 100 },
      { key: 'qty', label: 'Qty Delta', width: 80, align: 'right' },
      { key: 'staff', label: 'Recorded By', width: 130 },
    ],
    rows: filteredRows.value.map((row) => ({
      date: formatDateTime(row.createdAt),
      recordId: row.id,
      item: `${row.itemName} (${row.sku})`,
      action: row.actionType,
      qty: `${Number(row.qtyDelta || 0) > 0 ? '+' : ''}${row.qtyDelta}`,
      staff: row.staffName,
    })),
    totals: { Records: String(filteredRows.value.length) },
  })
    toast.success('Stock history exported.')
  } catch (error) {
    console.error(error)
    toast.error('Unable to export stock history.')
  }
}
</script>
