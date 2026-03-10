<template>
  <div class="space-y-[3px]">
    <section class="grid gap-1.5 md:grid-cols-3">
      <AccountingMetricCard label="Daily Collections" :value="money(dailyPaid)" icon="calendar" trend="Collected today" />
      <AccountingMetricCard label="Weekly Collections" :value="money(weeklyPaid)" icon="week" trend="Collected this week" />
      <AccountingMetricCard label="Monthly Collections" :value="money(monthlyPaid)" icon="month" trend="Collected this month" />
    </section>

    <section class="grid gap-[6px] xl:grid-cols-[286px_minmax(0,1fr)]">
      <article class="rounded-[12px] border border-[#d8decf] bg-white p-1.5 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce8f8] text-[#1f6be8]">
              <PlusCircleIcon class="h-5 w-5" />
            </span>
            <h2 class="m-0 text-[16px] font-semibold tracking-[-0.03em] text-[#0f172a]">Add Credit Collection</h2>
          </div>

          <button class="h-[28px] rounded-[10px] bg-[#3f6b4f] px-3 text-[11px] font-semibold text-white transition hover:bg-[#355846]" @click="saveCollection">
            Save
          </button>
        </div>

        <div class="mt-2 space-y-1.5">
          <div ref="customerFieldRef" class="relative">
            <label class="block">
              <span class="mb-1 block text-[11px] font-medium text-[#344640]">Customer Name</span>
              <input
                v-model="form.customerName"
                type="text"
                placeholder="Select customer with credit"
                class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none"
                @focus="openSuggestions = true"
                @input="handleCustomerInput"
                @keydown.down.prevent="moveSuggestion(1)"
                @keydown.up.prevent="moveSuggestion(-1)"
                @keydown.enter.prevent="selectActiveSuggestion"
                @keydown.esc="openSuggestions = false"
              />
            </label>

            <div v-if="openSuggestions && creditCustomerOptions.length" class="absolute z-20 mt-1 w-full overflow-hidden rounded-[12px] border border-[#d8decf] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
              <button
                v-for="(option, index) in creditCustomerOptions"
                :key="option.id"
                type="button"
                class="flex w-full items-center justify-between border-b border-[#eef2ea] px-3 py-2 text-left last:border-b-0"
                :class="index === activeSuggestionIndex ? 'bg-[#eef4e8]' : 'bg-white hover:bg-[#faf8f1]'"
                @mousedown.prevent="applySuggestion(option)"
              >
                <span class="text-[11px] font-medium text-[#0f172a]">{{ option.name }}</span>
                <span class="text-[11px] font-semibold text-[#3f6b4f]">{{ money(option.balance) }}</span>
              </button>
            </div>
          </div>

          <div v-if="selectedCustomer" class="rounded-[11px] border border-[#d8decf] bg-[#f8fbf5] px-3 py-2 text-[11px] text-[#5f6f5e]">
            Current outstanding: <span class="font-semibold text-[#3f6b4f]">{{ money(selectedCustomer.balance) }}</span>
          </div>
          <div v-else class="rounded-[11px] border border-[#eadfc5] bg-[#fdf8ec] px-3 py-2 text-[11px] text-[#8a6d3b]">
            {{ noCreditMessage }}
          </div>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Amount Collected</span>
            <input v-model="form.amountPaid" type="number" min="0" placeholder="e.g. 10000" class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" @input="clampAmount" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Collection Date</span>
            <input v-model="form.date" type="date" class="h-[30px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[11px] text-[#0f172a] outline-none" />
          </label>

          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#344640]">Note</span>
            <textarea
              ref="noteInputRef"
              v-model="form.note"
              rows="1"
              placeholder="Optional collection note"
              class="min-h-[34px] w-full overflow-hidden resize-none rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 py-1.5 text-[11px] text-[#0f172a] outline-none"
              @input="resizeNoteInput"
            ></textarea>
          </label>
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
                <h2 class="m-0 text-[16px] font-semibold tracking-[-0.03em] text-[#0f172a]">Credit Collection Report</h2>
                <p class="m-0 text-[10px] text-[#64748b]">Backend edit and delete are not available yet for credit collections.</p>
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
                <th class="px-3 py-2">Customer</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2 text-right">Amount Paid</th>
                <th class="px-3 py-2 text-right">Balance</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a] odd:bg-white even:bg-[#faf8f1]">
                <td class="px-3 py-2.5 text-[#5f6f5e]">{{ dateLabel(row.date) }}</td>
                <td class="px-3 py-2.5 font-medium">{{ row.name }}</td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex rounded-full px-2 py-1 text-[11px] font-semibold bg-[#d6f1de] text-[#0f8a3f]">Paid</span>
                </td>
                <td class="px-3 py-2.5 text-right font-semibold text-[#198142]">{{ money(row.amountPaid) }}</td>
                <td class="px-3 py-2.5 text-right font-semibold">{{ money(row.outstandingAmount) }}</td>
                <td class="px-3 py-2.5 text-right text-[10px] font-semibold text-[#94a3b8]">Edit unavailable</td>
              </tr>
              <tr v-if="!filteredRows.length">
                <td colspan="6" class="px-3 py-4 text-center text-[11px] text-[#64748b]">No credit records in the selected range.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import { ArrowDownTrayIcon, ChartBarSquareIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'
import AccountingMetricCard from '@/components/Accounting/AccountingMetricCard.vue'
import { useCreditStore } from '@/stores/credits'
import { useSalesStore } from '@/stores/sales'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount } from '@/utils/formatters'
import { inDateRange, startOfMonthIso, startOfWeekIso, todayIso } from '@/utils/date'

const props = defineProps({
  activeBranch: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  search: { type: String, default: '' },
  statusFilter: { type: String, default: 'ALL' },
})

const creditStore = useCreditStore()
const salesStore = useSalesStore()
const noteInputRef = ref(null)
const customerFieldRef = ref(null)
const openSuggestions = ref(false)
const activeSuggestionIndex = ref(0)
const form = reactive({ customerName: '', amountPaid: '', date: todayIso(), note: '' })

const creditCustomerOptions = computed(() => salesStore.customers
  .filter((customer) => customer.branch === props.activeBranch && Number(customer.accountBalance || 0) > 0)
  .sort((left, right) => Number(right.accountBalance || 0) - Number(left.accountBalance || 0))
  .map((customer) => ({
    id: customer.id,
    name: customer.fullName,
    balance: Number(customer.accountBalance || 0),
  })))

const selectedCustomer = computed(() => {
  const name = String(form.customerName || '').trim().toLowerCase()
  return creditCustomerOptions.value.find((customer) => customer.name.toLowerCase() === name) || null
})

const noCreditMessage = computed(() => {
  if (creditCustomerOptions.value.length === 0) return 'No customer with outstanding credit in this branch.'
  return 'Choose a customer from the outstanding credit list.'
})

const branchRows = computed(() => creditStore.byBranch(props.activeBranch))
const filteredRows = computed(() => {
  const query = props.search.trim().toLowerCase()
  return branchRows.value.filter((row) => {
    const matchesRange = inDateRange(row.date, props.fromDate, props.toDate)
    const matchesQuery = !query || String(row.name || '').toLowerCase().includes(query)
    const matchesStatus = props.statusFilter === 'ALL' || props.statusFilter === 'PAID'
    return matchesRange && matchesQuery && matchesStatus
  })
})

const sumPaid = (rows) => rows.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0)
const dailyPaid = computed(() => sumPaid(branchRows.value.filter((row) => row.date === todayIso())))
const weeklyPaid = computed(() => sumPaid(branchRows.value.filter((row) => inDateRange(row.date, startOfWeekIso(), todayIso()))))
const monthlyPaid = computed(() => sumPaid(branchRows.value.filter((row) => inDateRange(row.date, startOfMonthIso(), todayIso()))))

const money = (value) => `USh ${formatAmount(value)}`
const dateLabel = (value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })

const resizeNoteInput = () => {
  const element = noteInputRef.value
  if (!element) return
  element.style.height = '34px'
  element.style.height = `${Math.max(34, element.scrollHeight)}px`
}

const handleOutsideClick = (event) => {
  if (!customerFieldRef.value?.contains(event.target)) openSuggestions.value = false
}

onMounted(async () => {
  document.addEventListener('mousedown', handleOutsideClick)
  await salesStore.initialize(props.activeBranch, true)
})

onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsideClick))

watch(() => props.activeBranch, async (branch, previousBranch) => {
  if (!branch || branch === previousBranch) return
  await salesStore.initialize(branch, true)
  resetForm()
})

watch(creditCustomerOptions, (options) => {
  if (!options.length) activeSuggestionIndex.value = 0
  else if (activeSuggestionIndex.value >= options.length) activeSuggestionIndex.value = options.length - 1
})

const handleCustomerInput = () => {
  openSuggestions.value = true
  activeSuggestionIndex.value = 0
  clampAmount()
}

const applySuggestion = (customer) => {
  form.customerName = customer.name
  clampAmount()
  openSuggestions.value = false
}

const moveSuggestion = (direction) => {
  if (!creditCustomerOptions.value.length) return
  openSuggestions.value = true
  const total = creditCustomerOptions.value.length
  activeSuggestionIndex.value = (activeSuggestionIndex.value + direction + total) % total
}

const selectActiveSuggestion = () => {
  const option = creditCustomerOptions.value[activeSuggestionIndex.value]
  if (!option) return
  applySuggestion(option)
}

const clampAmount = () => {
  const balance = Number(selectedCustomer.value?.balance || 0)
  const amount = Math.max(Number(form.amountPaid || 0), 0)
  if (!amount) return
  if (balance > 0 && amount > balance) {
    form.amountPaid = String(balance)
  }
}

const resetForm = () => {
  form.customerName = ''
  form.amountPaid = ''
  form.date = todayIso()
  form.note = ''
  openSuggestions.value = false
  activeSuggestionIndex.value = 0
  nextTick(resizeNoteInput)
}

const saveCollection = async () => {
  if (!selectedCustomer.value) {
    toast.error(creditCustomerOptions.value.length ? 'Select a customer who has outstanding credit.' : 'This branch has no customers with outstanding credit.')
    return
  }

  const amount = Math.max(Number(form.amountPaid || 0), 0)
  if (amount <= 0) {
    toast.error('Enter a collection amount greater than 0.')
    return
  }

  if (amount > Number(selectedCustomer.value.balance || 0)) {
    toast.error(`Collection amount cannot exceed ${money(selectedCustomer.value.balance)}.`)
    return
  }

  const result = await creditStore.saveAccountingCollection({
    branch: props.activeBranch,
    date: form.date,
    customerName: selectedCustomer.value.name,
    amountPaid: amount,
    note: form.note,
  })
  if (!result?.ok) {
    toast.error(result?.error || 'Unable to save collection.')
    return
  }
  await salesStore.initialize(props.activeBranch, true)
  if (result?.warning) toast.warning(result.warning)
  else toast.success('Collection saved to backend.')
  resetForm()
}

const exportPdf = async () => {
  await exportReportToPdf({
    title: `Credit Collection Report - ${props.activeBranch}`,
    filename: `${props.activeBranch}-credit-collection`,
    meta: { Branch: props.activeBranch, Period: `${props.fromDate} to ${props.toDate}` },
    columns: [
      { key: 'date', label: 'Date', width: 90 },
      { key: 'customer', label: 'Customer' },
      { key: 'status', label: 'Status', width: 90 },
      { key: 'amountPaid', label: 'Amount Paid', align: 'right', width: 100 },
      { key: 'amountDue', label: 'Balance', align: 'right', width: 100 },
    ],
    rows: filteredRows.value.map((row) => ({ date: dateLabel(row.date), customer: row.name, status: 'Paid', amountPaid: money(row.amountPaid), amountDue: money(row.outstandingAmount) })),
    totals: {
      'Amount Paid': money(sumPaid(filteredRows.value)),
      Balance: money(filteredRows.value.reduce((sum, row) => sum + Number(row.outstandingAmount || 0), 0)),
    },
  })
  toast.success('Credit collection PDF downloaded.')
}

nextTick(resizeNoteInput)
</script>