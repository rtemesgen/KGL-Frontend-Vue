<template>
  <div v-if="open && receipt" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-[720px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#dce8f8] text-[#1f6be8]"><DocumentTextIcon class="h-4 w-4" /></span>
          <div>
            <h3 class="m-0 text-[15px] font-semibold text-[#0f172a]">Procurement Receipt</h3>
            <p class="m-0 text-[10px] text-[#64748b]">{{ receipt.receiptId }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="h-[32px] rounded-[9px] border border-[#d8decf] bg-white px-3 text-[11px] font-semibold text-[#475569]" @click="$emit('print')">Print</button>
          <button class="h-[32px] rounded-[9px] bg-[#2f6b4d] px-3 text-[11px] font-semibold text-white" @click="$emit('export')">PDF</button>
          <button class="text-[#94a3b8] transition hover:text-[#475569]" @click="$emit('close')"><XMarkIcon class="h-5 w-5" /></button>
        </div>
      </header>

      <div class="space-y-4 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="m-0 text-[20px] font-semibold tracking-[-0.04em] text-[#1f6be8]">Procurement Receipt</h2>
            <p class="mt-1 text-[12px] text-[#475569]">Receipt #: {{ receipt.receiptId }}</p>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">Issue Date</div>
            <div class="mt-1 text-[14px] font-semibold text-[#0f172a]">{{ dateLabel(receipt.createdAt) }}</div>
          </div>
        </div>

        <section>
          <div class="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f6be8]">Supplier Information</div>
          <div class="grid gap-3 rounded-[12px] border border-[#d8decf] bg-[#fafcf8] p-3 md:grid-cols-2">
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Company Name</div>
              <div class="mt-1 text-[14px] font-semibold text-[#0f172a]">{{ receipt.supplierName }}</div>
            </div>
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Contact Details</div>
              <div class="mt-1 text-[12px] text-[#334155]">{{ supplier?.phone || '-' }}</div>
              <div class="text-[12px] text-[#334155]">{{ supplier?.email || '-' }}</div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f6be8]">Procured Items</div>
          <div class="overflow-hidden rounded-[12px] border border-[#d8decf]">
            <table class="min-w-full border-collapse">
              <thead class="bg-[#eef1e6] text-left text-[10px] font-semibold text-[#334155]">
                <tr>
                  <th class="px-3 py-2">Item</th>
                  <th class="px-3 py-2 text-center">Qty</th>
                  <th class="px-3 py-2 text-right">Unit Cost</th>
                  <th class="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in receipt.items" :key="item.sku" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a]">
                  <td class="px-3 py-2.5">{{ item.name }}</td>
                  <td class="px-3 py-2.5 text-center">{{ item.qty }}</td>
                  <td class="px-3 py-2.5 text-right text-[#334155]">{{ money(item.costPrice) }}</td>
                  <td class="px-3 py-2.5 text-right font-semibold">{{ money(item.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="flex justify-end">
          <div class="w-full max-w-[280px] space-y-1 text-[12px] text-[#334155]">
            <div class="flex items-center justify-between"><span>Subtotal</span><span>{{ money(receipt.total) }}</span></div>
            <div class="flex items-center justify-between"><span>Tax (0%)</span><span>{{ money(0) }}</span></div>
            <div class="flex items-center justify-between border-t border-[#d8decf] pt-2 text-[15px] font-semibold text-[#0f172a]"><span>Grand Total</span><span class="text-[#1f6be8]">{{ money(receipt.total) }}</span></div>
            <div class="flex items-center justify-between text-[#16a34a]"><span>Amount Paid</span><span>-{{ money(receipt.amountPaid) }}</span></div>
            <div class="flex items-center justify-between rounded-[10px] bg-[#f8faf7] px-3 py-2 font-semibold"><span>Remaining</span><span>{{ money(receipt.amountRemaining) }}</span></div>
            <div class="flex items-center justify-between pt-1 text-[11px] italic text-[#64748b]"><span>Supplier Balance</span><span>{{ money(supplierOutstanding) }}</span></div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DocumentTextIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { formatAmount } from '@/utils/formatters'

defineProps({
  open: Boolean,
  receipt: { type: Object, default: null },
  supplier: { type: Object, default: null },
  supplierOutstanding: { type: Number, default: 0 },
})

defineEmits(['close', 'print', 'export'])

const money = (value) => `USh ${formatAmount(value)}`
const dateLabel = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
</script>
