<template>
  <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-[940px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#dce8f8] text-[#1f6be8]"><ClipboardDocumentListIcon class="h-4 w-4" /></span>
          <h3 class="m-0 text-[15px] font-semibold text-[#0f172a]">Manage Records</h3>
        </div>
        <div class="flex items-center gap-2">
          <button class="h-[34px] rounded-[10px] bg-[#2f6b4d] px-4 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(48,84,62,0.16)] transition hover:bg-[#27593f]" @click="exportRows">Export PDF</button>
          <button class="text-[#94a3b8] transition hover:text-[#475569]" @click="$emit('close')"><XMarkIcon class="h-5 w-5" /></button>
        </div>
      </header>
      <div class="space-y-3 p-4">
        <div class="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_180px_160px_160px]">
          <input v-model="searchQuery" type="text" placeholder="Search records..." class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[11px] text-[#22392e] outline-none" />
          <select v-model="actionFilter" class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[11px] text-[#22392e] outline-none">
            <option value="">All Actions</option>
            <option value="Procurement">Procurement</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Damage">Damage</option>
          </select>
          <input v-model="fromDate" type="date" class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[11px] text-[#22392e] outline-none" />
          <input v-model="toDate" type="date" class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[11px] text-[#22392e] outline-none" />
        </div>

        <div class="overflow-hidden rounded-[12px] border border-[#d8decf]">
          <div class="max-h-[420px] overflow-auto">
            <table class="min-w-full border-collapse">
              <thead class="bg-[#eef1e6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a7f67]">
                <tr>
                  <th class="w-[120px] px-3 py-2">Record ID</th>
                  <th class="px-3 py-2">Item</th>
                  <th class="w-[130px] px-3 py-2">Action Type</th>
                  <th class="w-[90px] px-3 py-2">Quantity</th>
                  <th class="w-[150px] px-3 py-2">Date/Time</th>
                  <th class="w-[150px] px-3 py-2">Staff Member</th>
                  <th class="w-[96px] px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredRows" :key="row.id" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a] odd:bg-white even:bg-[#fafcf9]">
                  <td class="px-3 py-2.5 font-semibold text-[#1f6be8]">#{{ row.id }}</td>
                  <td class="px-3 py-2.5">{{ row.itemName }}</td>
                  <td class="px-3 py-2.5"><span class="rounded-full px-2 py-1 text-[10px] font-semibold" :class="badgeTone(row.actionType)">{{ row.actionType }}</span></td>
                  <td class="px-3 py-2.5 font-semibold" :class="Number(row.qtyDelta || 0) < 0 ? 'text-[#dc2626]' : 'text-[#2f6b4d]'">{{ Number(row.qtyDelta || 0) > 0 ? '+' : '' }}{{ row.qtyDelta }}</td>
                  <td class="px-3 py-2.5 text-[#475569]">{{ timestamp(row.createdAt) }}</td>
                  <td class="px-3 py-2.5">{{ row.staffName }}</td>
                  <td class="px-3 py-2.5 text-right">
                    <div class="inline-flex items-center gap-2">
                      <button class="text-[#1f6be8]" @click="$emit('edit', row)"><PencilSquareIcon class="inline h-4 w-4" /></button>
                      <button class="text-[#dc2626]" @click="$emit('delete', row)"><TrashIcon class="inline h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredRows.length"><td colspan="7" class="px-3 py-5 text-center text-[11px] text-[#64748b]">No records match the current filters.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <footer class="flex justify-end gap-2 border-t border-[#d8decf] bg-[#faf8f1] px-4 py-3"><button class="h-[34px] rounded-[10px] border border-[#d8decf] bg-white px-4 text-[11px] font-semibold text-[#475569]" @click="$emit('close')">Done</button></footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { ClipboardDocumentListIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  open: Boolean,
  rows: { type: Array, default: () => [] },
  branchLabel: { type: String, default: '' },
})
defineEmits(['close', 'edit', 'delete'])

const searchQuery = ref('')
const actionFilter = ref('')
const fromDate = ref('')
const toDate = ref('')

const badgeTone = (value) => value === 'Procurement' ? 'bg-[#dce8f8] text-[#1f6be8]' : value === 'Adjustment' ? 'bg-[#efe1f8] text-[#8b3fe2]' : 'bg-[#ffe4df] text-[#dc2626]'
const timestamp = (value) => new Date(value).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: 'numeric', minute: '2-digit' })
const sameOrAfter = (value, min) => !min || value >= min
const sameOrBefore = (value, max) => !max || value <= max

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return props.rows.filter((row) => {
    const day = String(row.createdAt || '').slice(0, 10)
    const matchesQuery = !query || `${row.id} ${row.itemName} ${row.staffName} ${row.actionType}`.toLowerCase().includes(query)
    const matchesType = !actionFilter.value || row.actionType === actionFilter.value
    const matchesFrom = sameOrAfter(day, fromDate.value)
    const matchesTo = sameOrBefore(day, toDate.value)
    return matchesQuery && matchesType && matchesFrom && matchesTo
  })
})

const exportRows = async () => {
  try {
    await exportReportToPdf({
      title: `Stock Records - ${props.branchLabel || 'Branch'}`,
      filename: `${props.branchLabel || 'branch'}-stock-records`,
      meta: {
        Branch: props.branchLabel || '-',
        From: fromDate.value || '-',
        To: toDate.value || '-',
      },
      orientation: 'landscape',
      columns: [
        { key: 'id', label: 'Record ID', width: 85 },
        { key: 'item', label: 'Item', width: 130 },
        { key: 'type', label: 'Action Type', width: 90 },
        { key: 'qty', label: 'Quantity', width: 70, align: 'right' },
        { key: 'date', label: 'Date/Time', width: 110 },
        { key: 'staff', label: 'Staff Member', width: 110 },
      ],
      rows: filteredRows.value.map((row) => ({
        id: row.id,
        item: row.itemName,
        type: row.actionType,
        qty: `${Number(row.qtyDelta || 0) > 0 ? '+' : ''}${formatAmount(row.qtyDelta || 0)}`,
        date: timestamp(row.createdAt),
        staff: row.staffName,
      })),
      totals: {
        Records: String(filteredRows.value.length),
      },
    })
    toast.success('Stock records exported.')
  } catch (error) {
    console.error(error)
    toast.error('Unable to export stock records.')
  }
}
</script>
