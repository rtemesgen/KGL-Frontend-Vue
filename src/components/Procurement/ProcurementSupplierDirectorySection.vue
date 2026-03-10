<template>
  <section class="rounded-[14px] border border-[#d9e4db] bg-[#fcfdf9] p-2 shadow-[0_8px_18px_rgba(40,70,54,0.07)]">
    <div>
      <h3 class="m-0 text-[15px] font-semibold tracking-[-0.04em] text-[#22392e]">Supplier Directory</h3>
      <p class="m-0 text-[11px] text-[#6b8076]">Outstanding balances and payment processing for {{ branchLabel }}.</p>
    </div>

    <div class="mt-3 overflow-hidden rounded-[12px] border border-[#d9e4db]">
      <div class="max-h-[420px] overflow-auto">
      <table class="min-w-full border-collapse">
        <thead class="bg-[#f6f8f4] text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">
          <tr>
            <th class="border-b border-[#d9e4db] px-3 py-2">Supplier Name</th>
            <th class="border-b border-[#d9e4db] px-3 py-2">Contact Person</th>
            <th class="border-b border-[#d9e4db] px-3 py-2">Email & Phone</th>
            <th class="border-b border-[#d9e4db] px-3 py-2">Outstanding Balance</th>
            <th class="border-b border-[#d9e4db] px-3 py-2">Status</th>
            <th class="border-b border-[#d9e4db] px-3 py-2">Payment Amount</th>
            <th class="w-[150px] border-b border-[#d9e4db] px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="supplier in suppliers" :key="supplier.id" class="border-b border-[#e4ebe5] text-[12px] text-[#22392e] even:bg-[#fafcf9]">
            <td class="px-3 py-3">
              <div class="font-semibold">{{ supplier.name }}</div>
              <div class="text-[10px] text-[#6b8076]">ID: {{ supplier.id }}</div>
            </td>
            <td class="px-3 py-3">{{ supplier.contactName || '-' }}</td>
            <td class="px-3 py-3 text-[#5c7368]">
              <div>{{ supplier.email || '-' }}</div>
              <div>{{ supplier.phone || '-' }}</div>
            </td>
            <td class="px-3 py-3 font-semibold" :class="Number(outstandingMap[supplier.id] || 0) > 0 ? 'text-[#b42318]' : 'text-[#2f6b4d]'">{{ money(outstandingMap[supplier.id] || 0) }}</td>
            <td class="px-3 py-3"><span class="rounded-full px-2 py-1 text-[10px] font-semibold" :class="statusTone(supplier.status)">{{ supplier.status }}</span></td>
            <td class="px-3 py-3">
              <input
                :value="paymentDrafts[supplier.id] || ''"
                type="text"
                inputmode="decimal"
                class="h-[34px] w-[140px] rounded-[10px] border border-[#d3dfd5] bg-white px-3 text-[12px] text-[#22392e] outline-none"
                placeholder="0.00"
                @input="$emit('update-payment', supplier.id, $event.target.value)"
              />
            </td>
            <td class="px-3 py-3 text-right">
              <button class="rounded-[9px] bg-[#2f6b4d] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#27593f]" @click="$emit('process-payment', supplier)">Process Payment</button>
            </td>
          </tr>
          <tr v-if="!suppliers.length">
            <td colspan="7" class="px-3 py-5 text-center text-[12px] text-[#6b8076]">No suppliers match the current search.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-[#6b8076]">
      <span>{{ suppliers.length }} suppliers shown</span>
      <span>Total outstanding: <strong class="text-[#22392e]">{{ money(totalOutstanding) }}</strong></span>
    </div>
  </section>
</template>

<script setup>
import { formatAmount } from '@/utils/formatters'

defineProps({
  suppliers: { type: Array, default: () => [] },
  outstandingMap: { type: Object, default: () => ({}) },
  paymentDrafts: { type: Object, default: () => ({}) },
  branchLabel: { type: String, default: '' },
  totalOutstanding: { type: Number, default: 0 },
})

defineEmits(['update-payment', 'process-payment'])

const money = (value) => `USh ${formatAmount(value)}`
const statusTone = (value) => value === 'Active'
  ? 'bg-[#dff3e5] text-[#2f6b4d]'
  : value === 'On Hold'
    ? 'bg-[#f9e6ba] text-[#9a7b13]'
    : 'bg-[#eceff3] text-[#6b7280]'
</script>
