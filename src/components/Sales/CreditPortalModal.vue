<template>
  <div v-if="open" class="fixed inset-0 z-[65] grid place-items-center bg-[rgba(15,23,42,0.24)] p-2 [backdrop-filter:blur(2px)]" @click.self="$emit('cancel')">
    <section class="w-full max-w-[420px] rounded-[16px] border border-[#d3dfd5] bg-[#fbfcf8] shadow-[0_14px_34px_rgba(40,70,54,0.18)]">
      <header class="flex items-center gap-2.5 border-b border-[#d3dfd5] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-3 py-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f7e6cf] text-[#a6651e]">
          <CreditCardIcon class="h-4 w-4" />
        </div>
        <div>
          <h3 class="m-0 text-[15px] font-semibold text-[#22392e]">Credit Portal</h3>
          <p class="m-0 text-[10px] text-[#5c7368]">Use an existing customer name where possible so credit stays linked.</p>
        </div>
      </header>

      <div class="space-y-2.5 px-3 py-3">
        <div class="rounded-[12px] border border-[#d3dfd5] bg-[#f8faf7] px-3 py-2 text-right">
          <div class="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Credited Amount</div>
          <div class="text-[24px] font-semibold tracking-[-0.05em] text-[#2f6b4d]">{{ creditedAmount }}</div>
        </div>

        <label class="relative grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          Customer Name
          <input
            :value="creditForm.customerName"
            type="text"
            placeholder="Start typing a saved customer name"
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
              :key="customer"
              type="button"
              class="block w-full border-b border-[#eef2ee] px-3 py-2 text-left text-[12px] font-medium normal-case text-[#22392e] last:border-b-0"
              :class="index === highlightedIndex ? 'bg-[#eef5eb]' : 'hover:bg-[#f4f8f4]'"
              @mousedown.prevent="pickCustomer(customer)"
            >
              {{ customer }}
            </button>
          </div>
        </label>

        <label class="grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          NIN / National ID
          <input :value="creditForm.nationalId" type="text" placeholder="e.g. CM30211045K" class="h-10 rounded-xl border border-[#d3dfd5] bg-white px-3 text-[13px] normal-case text-[#22392e] outline-none placeholder:text-[#94a59c]" @input="$emit('update-field', 'nationalId', $event.target.value)" />
        </label>

        <div class="rounded-xl border border-[#d3dfd5] bg-[#f8faf7] px-3 py-2">
          <div class="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">Total Outstanding</div>
          <div class="mt-1 text-[12px] text-[#5c7368]">UGX <span class="ml-1.5 text-[20px] font-semibold tracking-[-0.04em] text-[#30543e]">{{ outstandingAmount }}</span></div>
        </div>

        <div class="rounded-xl border border-[#eadbc1] bg-[#fbf5e8] px-3 py-2 text-[#8d6a2f]">
          <p class="m-0 text-[11px] leading-5">Crediting this transaction updates the customer's ledger instantly.</p>
        </div>
      </div>

      <footer class="flex justify-end gap-2 border-t border-[#d3dfd5] px-3 py-2.5">
        <button class="inline-flex h-8 items-center justify-center rounded-lg border border-[#d3dfd5] bg-white px-3 text-[12px] font-semibold text-[#42556b] transition hover:bg-[#f4f6f8]" @click="$emit('cancel')">
          Cancel
        </button>
        <button class="inline-flex h-8 items-center justify-center rounded-lg bg-[#2f6b4d] px-3 text-[12px] font-semibold text-white transition hover:bg-[#27593f]" @click="$emit('save')">
          Save
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { CreditCardIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  creditForm: {
    type: Object,
    required: true,
  },
  creditedAmount: {
    type: String,
    required: true,
  },
  outstandingAmount: {
    type: String,
    required: true,
  },
  customerOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['cancel', 'save', 'update-field'])
const openSuggestions = ref(false)
const highlightedIndex = ref(0)

const visibleSuggestions = computed(() => {
  const needle = String(props.creditForm.customerName || '').trim().toLowerCase()
  const options = !needle
    ? props.customerOptions
    : props.customerOptions.filter((customer) => customer.toLowerCase().includes(needle))
  return options.slice(0, 6)
})

const onNameInput = (event) => {
  openSuggestions.value = true
  highlightedIndex.value = 0
  emit('update-field', 'customerName', event.target.value)
}

const pickCustomer = (customer) => {
  emit('update-field', 'customerName', customer)
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
</script>
