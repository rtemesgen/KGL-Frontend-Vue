<template>
  <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-[920px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div>
          <h3 class="m-0 text-[16px] font-semibold text-[#0f172a]">Supplier Payment History</h3>
          <p class="m-0 text-[11px] text-[#64748b]">Recent supplier payment audit for {{ branchLabel }}.</p>
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
          <input v-model="search" type="text" placeholder="Search supplier, receipt, or staff..." class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] text-[#0f172a] outline-none" />
          <select v-model="supplierFilter" class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] text-[#0f172a] outline-none">
            <option value="">All Suppliers</option>
            <option v-for="supplier in supplierOptions" :key="supplier" :value="supplier">{{ supplier }}</option>
          </select>
        </div>
      </div>
      <div class="max-h-[420px] overflow-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-[#eef1e6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a7f67]">
            <tr>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Supplier</th>
              <th class="px-3 py-2">Amount</th>
              <th class="px-3 py-2">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in filteredPayments" :key="payment.id" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a] odd:bg-white even:bg-[#fafcf9]">
              <td class="px-3 py-2.5 text-[#64748b]">{{ formatDateTime(payment.createdAt) }}</td>
              <td class="px-3 py-2.5 font-semibold">{{ payment.supplierName }}</td>
              <td class="px-3 py-2.5 font-semibold text-[#2f6b4d]">{{ money(payment.amount) }}</td>
              <td class="px-3 py-2.5">{{ payment.createdBy }}</td>
            </tr>
            <tr v-if="!filteredPayments.length">
              <td colspan="5" class="px-3 py-5 text-center text-[11px] text-[#64748b]">No supplier payments recorded for the current filter.</td>
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
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  open: Boolean,
  payments: { type: Array, default: () => [] },
  branchLabel: { type: String, default: '' },
})

defineEmits(['close'])

const search = ref('')
const supplierFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const supplierOptions = computed(() => Array.from(new Set(props.payments.map((payment) => payment.supplierName))).sort())
const filteredPayments = computed(() => {
  const query = search.value.trim().toLowerCase()
  return props.payments.filter((payment) => {
    const matchesSupplier = !supplierFilter.value || payment.supplierName === supplierFilter.value
    const paymentDate = String(payment.createdAt || '').slice(0, 10)
    const matchesFrom = !fromDate.value || paymentDate >= fromDate.value
    const matchesTo = !toDate.value || paymentDate <= toDate.value
    const haystack = `${payment.supplierName} ${payment.createdBy} ${(payment.allocations || []).map((entry) => entry.receiptId).join(' ')} ${payment.note || ''}`.toLowerCase()
    return matchesSupplier && matchesFrom && matchesTo && (!query || haystack.includes(query))
  })
})

const money = (value) => `USh ${formatAmount(value)}`
const formatDateTime = (value) => new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

const exportHistory = async () => {
  try {
    await exportReportToPdf({
    title: `Supplier Payment History - ${props.branchLabel}`,
    filename: `${props.branchLabel}-supplier-payment-history`,
    orientation: 'landscape',
    meta: { Branch: props.branchLabel },
    columns: [
      { key: 'date', label: 'Date', width: 100 },
      { key: 'supplier', label: 'Supplier', width: 160 },
      { key: 'amount', label: 'Amount', width: 90, align: 'right' },
      { key: 'appliedTo', label: 'Applied To', width: 220 },
      { key: 'recordedBy', label: 'Recorded By', width: 130 },
    ],
    rows: filteredPayments.value.map((payment) => ({
      date: formatDateTime(payment.createdAt),
      supplier: payment.supplierName,
      amount: money(payment.amount),
      appliedTo: payment.allocations?.length ? payment.allocations.map((entry) => entry.receiptId).join(', ') : 'Unapplied',
      recordedBy: payment.createdBy,
    })),
    totals: { Payments: money(filteredPayments.value.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)) },
  })
    toast.success('Supplier payment history exported.')
  } catch (error) {
    console.error(error)
    toast.error('Unable to export supplier payment history.')
  }
}
</script>
