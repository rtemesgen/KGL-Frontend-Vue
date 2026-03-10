<template>
  <div class="space-y-[3px]">
    <section class="grid gap-1.5 md:grid-cols-3">
      <AccountingMetricCard label="Daily Expenses" :value="money(dailyTotal)" icon="calendar" />
      <AccountingMetricCard label="Weekly Expenses" :value="money(weeklyTotal)" icon="week" />
      <AccountingMetricCard label="Monthly Expenses" :value="money(monthlyTotal)" icon="month" />
    </section>

    <section class="grid gap-[6px] xl:grid-cols-[286px_minmax(0,1fr)]">
      <article class="rounded-[12px] border border-[#d8decf] bg-white p-1.5 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce8f8] text-[#1f6be8]">
            <PlusCircleIcon class="h-5 w-5" />
          </span>
          <h2 class="m-0 text-[16px] font-semibold tracking-[-0.03em] text-[#0f172a]">Add Expense</h2>
        </div>

        <div class="mt-2 space-y-1.5">
          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Reason</span>
            <input v-model="form.reason" type="text" placeholder="Office supplies, transport, fuel..." class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Amount</span>
            <input v-model="form.amount" type="number" min="0" placeholder="e.g. 25000" class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Paid To</span>
            <input v-model="form.paidTo" type="text" placeholder="Vendor or individual name" class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Date</span>
            <input v-model="form.date" type="date" class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <div class="flex gap-2 pt-1">
            <button class="h-[30px] flex-1 rounded-[11px] bg-[#3f6b4f] px-4 text-[11px] font-semibold text-white transition hover:bg-[#355846]" @click="saveExpense">
              Save Expense
            </button>
          </div>
        </div>
      </article>

      <article class="rounded-[16px] border border-[#d8decf] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
        <div class="space-y-1.5 p-1.5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex items-center gap-2">
              <span class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#dce8f8] text-[#1f6be8]">
                <ChartBarSquareIcon class="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 class="m-0 text-[16px] font-semibold tracking-[-0.03em] text-[#0f172a]">Expenses Report</h2>
                <p class="m-0 text-[10px] text-[#64748b]">Expense updates are disabled until backend edit support is available.</p>
              </div>
            </div>

            <div class="flex justify-end">
              <button class="h-[30px] rounded-[11px] bg-[#3f6b4f] px-3 text-[11px] font-semibold text-white" @click="exportPdf">
                <ArrowDownTrayIcon class="mr-1 inline h-4 w-4" />Export PDF
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-hidden border-t border-[#e3e7da]">
          <table class="min-w-full border-collapse">
            <thead class="bg-[#eef1e6] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a7f67]">
              <tr>
                <th class="px-3 py-2">Date</th>
                <th class="px-3 py-2">Reason</th>
                <th class="px-3 py-2">Paid To</th>
                <th class="px-3 py-2 text-right">Amount</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a] odd:bg-white even:bg-[#faf8f1]">
                <td class="px-3 py-2.5 text-[#5f6f5e]">{{ dateLabel(row.date) }}</td>
                <td class="px-3 py-2.5 font-medium">{{ row.reason }}</td>
                <td class="px-3 py-2.5 text-[#475569]">{{ row.paidTo }}</td>
                <td class="px-3 py-2.5 text-right font-semibold">{{ money(row.amount) }}</td>
                <td class="px-3 py-2.5 text-right">
                  <span class="mr-3 text-[10px] font-semibold text-[#94a3b8]">Edit unavailable</span>
                  <button class="text-[#dc2626]" @click="deleteRow(row.id)"><TrashIcon class="inline h-4.5 w-4.5" /></button>
                </td>
              </tr>
              <tr v-if="!filteredRows.length">
                <td colspan="5" class="px-3 py-4 text-center text-[11px] text-[#64748b]">No expenses in the selected range.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="Confirm Delete"
      :message="`Proceed to delete ${pendingDeleteName}?`"
      confirm-text="Proceed"
      cancel-text="Cancel"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { ArrowDownTrayIcon, ChartBarSquareIcon, PlusCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AccountingMetricCard from '@/components/Accounting/AccountingMetricCard.vue'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import { useExpenseStore } from '@/stores/expenses'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount } from '@/utils/formatters'
import { inDateRange, startOfMonthIso, startOfWeekIso, todayIso } from '@/utils/date'

const props = defineProps({
  activeBranch: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  search: { type: String, default: '' },
})

const expenseStore = useExpenseStore()
const showDeleteConfirm = ref(false)
const pendingDeleteId = ref('')
const pendingDeleteName = ref('this expense')
const form = reactive({ reason: '', amount: '', paidTo: '', date: todayIso() })

const branchRows = computed(() => expenseStore.rows.filter((row) => row.branch === props.activeBranch))
const filteredRows = computed(() => {
  const query = props.search.trim().toLowerCase()
  return branchRows.value.filter((row) => {
    const matchesRange = inDateRange(row.date, props.fromDate, props.toDate)
    const matchesQuery = !query || `${row.reason} ${row.paidTo}`.toLowerCase().includes(query)
    return matchesRange && matchesQuery
  })
})

const sumAmount = (rows) => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
const dailyTotal = computed(() => sumAmount(branchRows.value.filter((row) => row.date === todayIso())))
const weeklyTotal = computed(() => sumAmount(branchRows.value.filter((row) => inDateRange(row.date, startOfWeekIso(), todayIso()))))
const monthlyTotal = computed(() => sumAmount(branchRows.value.filter((row) => inDateRange(row.date, startOfMonthIso(), todayIso()))))

const money = (value) => `USh ${formatAmount(value)}`
const dateLabel = (value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })

const resetForm = () => {
  form.reason = ''
  form.amount = ''
  form.paidTo = ''
  form.date = todayIso()
}

const saveExpense = async () => {
  const result = await expenseStore.saveExpense({ branch: props.activeBranch, date: form.date, reason: form.reason, amount: form.amount, paidTo: form.paidTo })
  if (!result?.ok) {
    toast.error(result?.error || 'Unable to save expense.')
    return
  }
  if (result?.warning) toast.warning(result.warning)
  else toast.success('Expense saved to backend.')
  resetForm()
}

const deleteRow = (id) => {
  const row = branchRows.value.find((entry) => String(entry.id) === String(id))
  pendingDeleteId.value = String(id)
  pendingDeleteName.value = row?.reason || 'this expense'
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  pendingDeleteId.value = ''
  pendingDeleteName.value = 'this expense'
}

const confirmDelete = async () => {
  const result = await expenseStore.deleteExpense(pendingDeleteId.value)
  if (!result?.ok) {
    toast.error(result?.error || 'Unable to delete expense.')
    cancelDelete()
    return
  }
  cancelDelete()
  toast.success('Expense deleted from backend.')
}

const exportPdf = async () => {
  await exportReportToPdf({
    title: `Expenses Report - ${props.activeBranch}`,
    filename: `${props.activeBranch}-expenses`,
    meta: { Branch: props.activeBranch, Period: `${props.fromDate} to ${props.toDate}` },
    columns: [
      { key: 'date', label: 'Date', width: 90 },
      { key: 'reason', label: 'Reason' },
      { key: 'paidTo', label: 'Paid To' },
      { key: 'amount', label: 'Amount', align: 'right', width: 100 },
    ],
    rows: filteredRows.value.map((row) => ({ date: dateLabel(row.date), reason: row.reason, paidTo: row.paidTo, amount: money(row.amount) })),
    totals: { 'Total Expense': money(sumAmount(filteredRows.value)) },
  })
  toast.success('Expenses PDF downloaded.')
}
</script>