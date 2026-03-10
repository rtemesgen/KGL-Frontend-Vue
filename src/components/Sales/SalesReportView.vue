<template>
  <div class="overflow-hidden rounded-[16px] border border-[#d8decf] bg-[#f4f6ef] shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
    <div class="space-y-1.5 px-1.5 py-1.5">
      <section class="grid gap-1.5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <div class="grid gap-1.5 md:grid-cols-2">
          <article v-for="card in summaryCards" :key="card.label" class="rounded-[10px] border border-[#d8decf] bg-white px-1.5 py-1">
            <div class="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#6a7f67]">{{ card.label }}</div>
            <div class="mt-1 text-[13px] font-semibold tracking-[-0.03em]" :class="card.tone">{{ card.value }}</div>
          </article>
        </div>

        <section class="rounded-[10px] border border-[#d8decf] bg-white p-1.5">
          <div class="flex flex-col gap-2">
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="m-0 text-[16px] font-semibold tracking-[-0.03em] text-[#0f172a]">Customer Credit Management</h3>
                <p class="m-0 mt-0.5 text-[10px] leading-4 text-[#64748b]">Current outstanding balances for this branch.</p>
              </div>

              <div class="rounded-[10px] border border-[#c9d7c3] bg-[#eef4e8] px-2.5 py-1.5 text-right">
                <div class="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#6a7f67]">Total Outstanding</div>
                <div class="mt-1 text-[14px] font-semibold tracking-[-0.03em] text-[#3f6b4f]">{{ money(totalOutstanding) }}</div>
              </div>
            </div>

            <div class="flex items-center justify-between rounded-[9px] border border-[#d8decf] bg-[#faf8f1] px-1.75 py-1.5">
              <div>
                <div class="text-[11px] font-semibold text-[#355846]">Current customers with open balances</div>
                <div class="mt-0.5 text-[10px] text-[#64748b]">Open the popup to see each customer's aggregated remaining balance.</div>
              </div>
              <button class="h-[30px] rounded-[8px] border border-[#d8decf] bg-[#f6f3e8] px-3 text-[10px] font-semibold text-[#355846] transition hover:bg-white" @click="showCustomersModal = true">
                View More
              </button>
            </div>
          </div>
        </section>
      </section>

      <section class="overflow-hidden rounded-[12px] border border-[#d8decf] bg-white">
        <table class="min-w-full border-collapse">
          <thead class="bg-[#eef1e6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a7f67]">
            <tr>
              <th class="px-1.75 py-1.5">Sale No</th>
              <th class="px-1.75 py-1.5">Type</th>
              <th class="px-1.75 py-1.5">Customer</th>
              <th class="px-1.75 py-1.5">Item Name</th>
              <th class="px-1.75 py-1.5">Total</th>
              <th class="px-1.75 py-1.5">Paid</th>
              <th class="px-1.75 py-1.5">Balance</th>
              <th class="px-1.75 py-1.5">Date/Time</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="transaction in dailyTransactions"
              :key="transaction.id"
              class="border-t border-[#e3e7da] text-[#0f172a]"
              :class="transaction.type === 'credit' ? 'bg-[#faf8f1]' : 'bg-white'"
            >
              <td class="px-1.75 py-1.5 text-[10px] font-medium">{{ compactId(transaction.id) }}</td>
              <td class="px-1.75 py-1.5 text-[10px]">{{ transaction.type === 'credit' ? 'Credit' : 'Cash' }}</td>
              <td class="px-1.75 py-1.5 text-[10px]">{{ transaction.customerName || 'Walk-in Customer' }}</td>
              <td class="px-1.75 py-1.5 text-[10px]">{{ (transaction.items || []).map((item) => item.name).join(', ') || '-' }}</td>
              <td class="px-1.75 py-1.5 text-[10px] font-medium">{{ money(transaction.total) }}</td>
              <td class="px-1.75 py-1.5 text-[10px]">{{ money(transaction.amountPaid) }}</td>
              <td class="px-1.75 py-1.5 text-[10px] font-medium" :class="transaction.outstandingAmount > 0 ? 'text-[#4b7a58]' : 'text-[#0f172a]'">{{ money(transaction.outstandingAmount) }}</td>
              <td class="px-1.75 py-1.5 text-[10px] text-[#6f7e6e]">{{ stamp(transaction.createdAt) }}</td>
            </tr>
            <tr v-if="!dailyTransactions.length">
              <td colspan="8" class="px-1.75 py-1.5 text-[11px] text-[#5f6f5e]">No sales for selected date.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <div v-if="showCustomersModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[#233127]/22 px-3 py-6" @click.self="showCustomersModal = false">
      <div class="w-full max-w-[560px] rounded-[16px] border border-[#d8decf] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
        <div class="flex items-center justify-between border-b border-[#d3dfd5] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-4 py-3">
          <div>
            <h3 class="m-0 text-[16px] font-semibold text-[#0f172a]">Current Customers</h3>
            <p class="m-0 mt-0.5 text-[10px] text-[#64748b]">Aggregated remaining balances for {{ props.activeBranch }}</p>
          </div>
          <button class="inline-flex h-8 items-center justify-center rounded-lg border border-[#d3dfd5] bg-white px-3 text-[12px] font-semibold text-[#42556b] transition hover:bg-[#f4f6f8]" @click="showCustomersModal = false">
            Close
          </button>
        </div>

        <div class="max-h-[420px] overflow-y-auto px-4 py-3 no-scrollbar">
          <div class="space-y-2">
            <article v-for="customer in outstandingByCustomer" :key="customer.name" class="flex items-center justify-between rounded-[12px] border border-[#d8decf] bg-[#faf8f1] px-1.75 py-1.5">
              <div>
                <div class="text-[14px] font-semibold text-[#0f172a]">{{ customer.name }}</div>
                <div class="mt-0.5 text-[10px] text-[#64748b]">{{ customer.reference }}</div>
              </div>
              <div class="text-[12px] font-semibold text-[#0f172a]">{{ money(customer.amount) }}</div>
            </article>
            <div v-if="!outstandingByCustomer.length" class="rounded-[12px] border border-dashed border-[#d8decf] bg-[#faf8f1] px-3 py-4 text-[10px] text-[#64748b]">
              No current customers with open balances.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  activeBranch: {
    type: String,
    required: true,
  },
  reportDate: {
    type: String,
    required: true,
  },
  search: {
    type: String,
    default: '',
  },
})

const salesStore = useSalesStore()
const showCustomersModal = ref(false)

const branchTransactions = computed(() => salesStore.transactionsForBranch(props.activeBranch))
const dailyTransactions = computed(() => {
  const query = props.search.trim().toLowerCase()
  return branchTransactions.value
    .filter((transaction) => String(transaction.createdAt || '').startsWith(props.reportDate))
    .filter((transaction) => {
      if (!query) return true
      const haystack = [transaction.id, transaction.cashier, transaction.customerName, ...transaction.items.map((item) => item.name)].join(' ').toLowerCase()
      return haystack.includes(query)
    })
})
const metrics = computed(() => ({
  totalSales: dailyTransactions.value.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0),
  transactions: dailyTransactions.value.length,
  totalPaid: dailyTransactions.value.reduce((sum, transaction) => sum + Number(transaction.amountPaid || 0), 0),
  balance: dailyTransactions.value.reduce((sum, transaction) => sum + Number(transaction.outstandingAmount || 0), 0),
}))
const summaryCards = computed(() => [
  { label: 'Total Sales', value: money(metrics.value.totalSales), tone: 'text-[#0f172a]' },
  { label: 'Transactions', value: String(metrics.value.transactions), tone: 'text-[#0f172a]' },
  { label: 'Total Paid', value: money(metrics.value.totalPaid), tone: 'text-[#0f172a]' },
  { label: 'Balance', value: money(metrics.value.balance), tone: 'text-[#4b7a58]' },
])
const outstandingByCustomer = computed(() => salesStore.customers
  .filter((customer) => customer.branch === props.activeBranch && Number(customer.accountBalance || 0) > 0)
  .map((customer) => ({
    name: customer.fullName,
    amount: Number(customer.accountBalance || 0),
    reference: customer.nationalId || customer.phone || customer.id,
  }))
  .sort((left, right) => right.amount - left.amount))
const totalOutstanding = computed(() => outstandingByCustomer.value.reduce((sum, customer) => sum + customer.amount, 0))

const money = (value) => `USh ${formatAmount(value)}`
const compactId = (value) => String(value || '').replace('ORD-', '').replace('CS-', '').replace('CR-', '')
const stamp = (value) => {
  const date = new Date(value)
  return `${date.toLocaleDateString('en-GB')}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}
</script>

