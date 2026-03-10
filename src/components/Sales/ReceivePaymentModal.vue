<template>
  <div v-if="open" class="fixed inset-0 z-[66] grid place-items-center bg-[rgba(15,23,42,0.24)] p-2 [backdrop-filter:blur(2px)]" @click.self="$emit('cancel')">
    <section class="w-full max-w-[400px] rounded-[16px] border border-[#d3dfd5] bg-[#fbfcf8] shadow-[0_14px_34px_rgba(40,70,54,0.18)]">
      <header class="flex items-center gap-2.5 border-b border-[#d3dfd5] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-3 py-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f7e6cf] text-[#a6651e]">
          <BanknotesIcon class="h-4 w-4" />
        </div>
        <div>
          <h3 class="m-0 text-[15px] font-semibold text-[#22392e]">Receive Payment</h3>
          <p class="m-0 text-[10px] text-[#5c7368]">Only customers with unpaid credit balances are suggested here.</p>
        </div>
      </header>

      <div class="space-y-2.5 px-3 py-3">
        <label class="relative grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          Customer Name
          <input
            :value="paymentForm.customerName"
            type="text"
            placeholder="Start typing a customer with unpaid balance"
            class="h-10 rounded-xl border border-[#d3dfd5] bg-white px-3 text-[13px] normal-case text-[#22392e] outline-none placeholder:text-[#94a59c]"
            @focus="openSuggestions = true"
            @blur="closeLater"
            @input="onNameInput"
            @keydown.down.prevent="moveSelection(1)"
            @keydown.up.prevent="moveSelection(-1)"
            @keydown.enter.prevent="selectHighlighted"
            @keydown.esc.prevent="openSuggestions = false"
          />
          <div v-if="visibleSuggestions.length && openSuggestions" class="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[12px] border border-[#d3dfd5] bg-white shadow-[0_10px_20px_rgba(40,70,54,0.12)]">
            <button
              v-for="(customer, index) in visibleSuggestions"
              :key="customer.id"
              type="button"
              class="flex w-full items-center justify-between gap-2 border-b border-[#eef2ee] px-3 py-2 text-left last:border-b-0"
              :class="index === highlightedIndex ? 'bg-[#eef5eb]' : 'hover:bg-[#f4f8f4]'"
              @mousedown.prevent="pickCustomer(customer)"
            >
              <span>
                <span class="block text-[12px] font-medium normal-case text-[#22392e]">{{ customer.label }}</span>
                <span v-if="customer.phone || customer.nationalId" class="block text-[9px] normal-case text-[#6c7b74]">{{ customer.phone || customer.nationalId }}</span>
              </span>
              <span class="text-[10px] font-semibold text-[#2f6b4d]">{{ money(balanceFor(customer)) }}</span>
            </button>
          </div>
        </label>

        <div class="rounded-xl border border-[#d9e4db] bg-[#f8faf7] px-3 py-2">
          <div class="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">Current Unpaid Balance</div>
          <div class="mt-1 text-[18px] font-semibold tracking-[-0.04em] text-[#2f6b4d]">{{ money(currentOutstanding) }}</div>
        </div>

        <label class="grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          Amount Received
          <input :value="paymentForm.amount" type="text" inputmode="numeric" placeholder="e.g. 25000" class="h-10 rounded-xl border border-[#d3dfd5] bg-white px-3 text-[13px] normal-case text-[#22392e] outline-none placeholder:text-[#94a59c]" @input="onAmountInput" />
          <span class="text-[8px] normal-case text-[#6b8076]">Max receivable: {{ money(currentOutstanding) }}</span>
        </label>

        <label class="grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          Note
          <input :value="paymentForm.note" type="text" placeholder="Optional note, e.g. partial credit repayment" class="h-10 rounded-xl border border-[#d3dfd5] bg-white px-3 text-[13px] normal-case text-[#22392e] outline-none placeholder:text-[#94a59c]" @input="$emit('update-field', 'note', $event.target.value)" />
        </label>
      </div>

      <footer class="flex justify-end gap-2 border-t border-[#d3dfd5] px-3 py-2.5">
        <button class="inline-flex h-8 items-center justify-center rounded-lg border border-[#d3dfd5] bg-white px-3 text-[12px] font-semibold text-[#42556b] transition hover:bg-[#f4f6f8]" @click="$emit('cancel')">
          Cancel
        </button>
        <button class="inline-flex h-8 items-center justify-center rounded-lg bg-[#2f6b4d] px-3 text-[12px] font-semibold text-white transition hover:bg-[#27593f]" @click="$emit('save')">
          Save Payment
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { BanknotesIcon } from '@heroicons/vue/24/outline'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  paymentForm: {
    type: Object,
    required: true,
  },
  customerOptions: {
    type: Array,
    required: true,
  },
  customerBalances: {
    type: Object,
    required: true,
  },
  currentOutstanding: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['cancel', 'save', 'update-field', 'select-customer'])
const openSuggestions = ref(false)
const highlightedIndex = ref(0)

const visibleSuggestions = computed(() => {
  const needle = String(props.paymentForm.customerName || '').trim().toLowerCase()
  const options = !needle
    ? props.customerOptions
    : props.customerOptions.filter((customer) => `${customer.label} ${customer.phone} ${customer.nationalId}`.toLowerCase().includes(needle))
  return options.slice(0, 6)
})

const onNameInput = (event) => {
  openSuggestions.value = true
  highlightedIndex.value = 0
  emit('update-field', 'customerName', event.target.value)
}

const pickCustomer = (customer) => {
  emit('select-customer', customer)
  openSuggestions.value = false
  highlightedIndex.value = 0
}

const moveSelection = (direction) => {
  openSuggestions.value = true
  if (!visibleSuggestions.value.length) return
  const nextIndex = highlightedIndex.value + direction
  if (nextIndex < 0) {
    highlightedIndex.value = visibleSuggestions.value.length - 1
    return
  }
  highlightedIndex.value = nextIndex % visibleSuggestions.value.length
}

const selectHighlighted = () => {
  const customer = visibleSuggestions.value[highlightedIndex.value] || visibleSuggestions.value[0]
  if (customer) pickCustomer(customer)
}

const closeLater = () => {
  window.setTimeout(() => {
    openSuggestions.value = false
    highlightedIndex.value = 0
  }, 120)
}

const balanceFor = (customer) => Number(props.customerBalances?.[customer?.id] || customer?.balance || 0)
const onAmountInput = (event) => {
  const digits = String(event.target.value || '').replace(/\D/g, '')
  const allowed = Math.max(Number(props.currentOutstanding || 0), 0)
  if (!digits) {
    emit('update-field', 'amount', '')
    return
  }
  emit('update-field', 'amount', String(Math.min(Number(digits), allowed)))
}
const money = (value) => `UGX ${formatAmount(value)}`
</script>
