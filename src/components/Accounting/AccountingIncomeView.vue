<template>
  <div class="space-y-[3px]">
    <section class="grid gap-1.5 md:grid-cols-3">
      <AccountingMetricCard label="Daily Income" :value="money(dailyTotal)" icon="calendar" trend="Live branch income" />
      <AccountingMetricCard label="Weekly Income" :value="money(weeklyTotal)" icon="week" trend="Branch income flow" />
      <AccountingMetricCard label="Monthly Income" :value="money(monthlyTotal)" icon="month" trend="Month to date" />
    </section>

    <section class="grid gap-[6px] xl:grid-cols-[286px_minmax(0,1fr)]">
      <article class="rounded-[12px] border border-[#d8decf] bg-white p-1.5 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#efe1f8] text-[#8b3fe2]">
            <PlusCircleIcon class="h-5 w-5" />
          </span>
          <h2 class="m-0 text-[16px] font-semibold tracking-[-0.03em] text-[#0f172a]">Add Income</h2>
        </div>

        <div class="mt-2 space-y-1.5">
          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Income Source</span>
            <input v-model="form.source" type="text" placeholder="Rental, consulting, storage fee..." class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Amount</span>
            <input v-model="form.amount" type="number" min="0" placeholder="e.g. 50000" class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Date</span>
            <input v-model="form.date" type="date" class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Details</span>
            <textarea
              ref="detailsInputRef"
              v-model="form.details"
              rows="1"
              placeholder="Additional information about this income..."
              class="min-h-[34px] w-full overflow-hidden rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 py-1.5 text-[11px] text-[#0f172a] outline-none"
              @input="resizeDetailsInput"
            ></textarea>
          </label>

          <div class="flex gap-2 pt-1">
            <button class="h-[30px] flex-1 rounded-[11px] bg-[#3f6b4f] px-4 text-[11px] font-semibold text-white transition hover:bg-[#355846]" @click="saveIncome">
              Save Income
            </button>
          </div>
        </div>
      </article>

      <article class="rounded-[16px] border border-[#d8decf] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
        <div class="space-y-1.5 p-1.5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex items-center gap-2">
              <span class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#efe1f8] text-[#8b3fe2]">
                <ChartBarSquareIcon class="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 class="m-0 text-[16px] font-semibold tracking-[-0.03em] text-[#0f172a]">Other Income Report</h2>
                <p class="m-0 text-[10px] text-[#64748b]">Backend edit and delete are not available yet for other income.</p>
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
                <th class="px-3 py-2">Source</th>
                <th class="px-3 py-2">Details</th>
                <th class="px-3 py-2 text-right">Amount</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a] odd:bg-white even:bg-[#faf8f1]">
                <td class="px-3 py-2.5 text-[#5f6f5e]">{{ dateLabel(row.date) }}</td>
                <td class="px-3 py-2.5 font-medium">{{ row.source || row.reason }}</td>
                <td class="px-3 py-2.5 text-[#475569]">{{ row.details || row.paidBy || '-' }}</td>
                <td class="px-3 py-2.5 text-right font-semibold text-[#198142]">{{ money(row.amount) }}</td>
              </tr>
              <tr v-if="!filteredRows.length">
                <td colspan="5" class="px-3 py-4 text-center text-[11px] text-[#64748b]">No income in the selected range.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { ArrowDownTrayIcon, ChartBarSquareIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'
import AccountingMetricCard from '@/components/Accounting/AccountingMetricCard.vue'
import { useOtherIncomeStore } from '@/stores/otherIncome'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount } from '@/utils/formatters'
import { inDateRange, startOfMonthIso, startOfWeekIso, todayIso } from '@/utils/date'

const props = defineProps({
  activeBranch: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  search: { type: String, default: '' },
})

const incomeStore = useOtherIncomeStore()
const detailsInputRef = ref(null)
const form = reactive({ source: '', amount: '', date: todayIso(), details: '' })

const branchRows = computed(() => incomeStore.rows.filter((row) => row.branch === props.activeBranch))
const filteredRows = computed(() => {
  const query = props.search.trim().toLowerCase()
  return branchRows.value.filter((row) => {
    const source = row.source || row.reason || ''
    const details = row.details || row.paidBy || ''
    const matchesRange = inDateRange(row.date, props.fromDate, props.toDate)
    const matchesQuery = !query || `${source} ${details}`.toLowerCase().includes(query)
    return matchesRange && matchesQuery
  })
})

const sumAmount = (rows) => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
const dailyTotal = computed(() => sumAmount(branchRows.value.filter((row) => row.date === todayIso())))
const weeklyTotal = computed(() => sumAmount(branchRows.value.filter((row) => inDateRange(row.date, startOfWeekIso(), todayIso()))))
const monthlyTotal = computed(() => sumAmount(branchRows.value.filter((row) => inDateRange(row.date, startOfMonthIso(), todayIso()))))

const money = (value) => `USh ${formatAmount(value)}`
const dateLabel = (value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })

const resizeDetailsInput = () => {
  const element = detailsInputRef.value
  if (!element) return
  element.style.height = '34px'
  element.style.height = `${Math.max(34, element.scrollHeight)}px`
}

const resetForm = () => {
  form.source = ''
  form.amount = ''
  form.date = todayIso()
  form.details = ''
  nextTick(resizeDetailsInput)
}

const saveIncome = async () => {
  const result = await incomeStore.saveIncome({ branch: props.activeBranch, date: form.date, source: form.source, details: form.details, amount: form.amount })
  if (!result?.ok) {
    toast.error(result?.error || 'Unable to save income.')
    return
  }
  if (result?.warning) toast.warning(result.warning)
  else toast.success('Income saved to backend.')
  resetForm()
}

const exportPdf = async () => {
  await exportReportToPdf({
    title: `Other Income Report - ${props.activeBranch}`,
    filename: `${props.activeBranch}-other-income`,
    meta: { Branch: props.activeBranch, Period: `${props.fromDate} to ${props.toDate}` },
    columns: [
      { key: 'date', label: 'Date', width: 90 },
      { key: 'source', label: 'Source' },
      { key: 'details', label: 'Details' },
      { key: 'amount', label: 'Amount', align: 'right', width: 100 },
    ],
    rows: filteredRows.value.map((row) => ({ date: dateLabel(row.date), source: row.source || row.reason, details: row.details || row.paidBy || '-', amount: money(row.amount) })),
    totals: { 'Total Income': money(sumAmount(filteredRows.value)) },
  })
  toast.success('Other income PDF downloaded.')
}

nextTick(resizeDetailsInput)
</script>