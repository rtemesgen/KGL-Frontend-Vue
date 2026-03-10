<template>
  <div v-if="open && form" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('cancel')">
    <div class="w-full max-w-[760px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div>
          <h3 class="m-0 text-[15px] font-semibold text-[#0f172a]">Edit Purchase Record</h3>
          <p class="m-0 text-[10px] text-[#64748b]">{{ form.receiptId }}</p>
        </div>
        <button class="text-[#94a3b8] transition hover:text-[#475569]" @click="$emit('cancel')"><XMarkIcon class="h-5 w-5" /></button>
      </header>

      <div class="space-y-3 p-4">
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <label class="block">
            <span class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">Supplier</span>
            <select :value="form.supplierId" class="h-[34px] w-full rounded-[10px] border border-[#d3dfd5] bg-white px-3 text-[11px] text-[#22392e] outline-none" @change="$emit('update-supplier', $event.target.value)">
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">Amount Paid</span>
            <input :value="form.amountPaid" type="text" inputmode="decimal" class="h-[34px] w-full rounded-[10px] border border-[#d3dfd5] bg-white px-3 text-[11px] text-[#22392e] outline-none" @input="$emit('update-amount-paid', $event.target.value)" />
          </label>
        </div>

        <div class="overflow-hidden rounded-[12px] border border-[#d8decf]">
          <table class="min-w-full border-collapse">
            <thead class="bg-[#eef1e6] text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
              <tr>
                <th class="px-3 py-2">Item</th>
                <th class="px-3 py-2 text-center">Qty</th>
                <th class="px-3 py-2 text-right">Cost</th>
                <th class="px-3 py-2 text-right">Selling</th>
                <th class="px-3 py-2 text-right">Total</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in form.items" :key="item.sku" class="border-t border-[#e3e7da] text-[11px] text-[#0f172a] even:bg-[#fafcf9]">
                <td class="px-3 py-2.5">
                  <div class="font-semibold">{{ item.name }}</div>
                  <div class="text-[10px] text-[#64748b]">{{ item.sku }}</div>
                </td>
                <td class="px-3 py-2.5"><input :value="item.qty" type="text" inputmode="numeric" class="h-[30px] w-full rounded-[9px] border border-[#d3dfd5] bg-white px-2 text-center text-[11px] outline-none" @input="$emit('update-item', { sku: item.sku, key: 'qty', value: $event.target.value })" /></td>
                <td class="px-3 py-2.5"><input :value="item.costPrice" type="text" inputmode="decimal" class="h-[30px] w-full rounded-[9px] border border-[#d3dfd5] bg-white px-2 text-right text-[11px] outline-none" @input="$emit('update-item', { sku: item.sku, key: 'costPrice', value: $event.target.value })" /></td>
                <td class="px-3 py-2.5"><input :value="item.sellingPrice" type="text" inputmode="decimal" class="h-[30px] w-full rounded-[9px] border border-[#d3dfd5] bg-white px-2 text-right text-[11px] outline-none" @input="$emit('update-item', { sku: item.sku, key: 'sellingPrice', value: $event.target.value })" /></td>
                <td class="px-3 py-2.5 text-right font-semibold">{{ money(Number(item.qty || 0) * Number(item.costPrice || 0)) }}</td>
                <td class="px-3 py-2.5 text-right"><button class="text-[#dc2626]" @click="$emit('remove-item', item.sku)"><TrashIcon class="inline h-4 w-4" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
          <div class="w-full max-w-[260px] space-y-1 text-[11px] text-[#475569]">
            <div class="flex items-center justify-between"><span>Grand Total</span><strong>{{ money(total) }}</strong></div>
            <div class="flex items-center justify-between"><span>Amount Paid</span><span>{{ money(form.amountPaid || 0) }}</span></div>
            <div class="flex items-center justify-between rounded-[10px] bg-[#f8faf7] px-3 py-2 font-semibold"><span>Balance</span><span>{{ money(balance) }}</span></div>
          </div>
        </div>
      </div>

      <footer class="flex justify-end gap-2 border-t border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <button class="h-[34px] rounded-[10px] border border-[#d8decf] bg-white px-4 text-[11px] font-semibold text-[#475569]" @click="$emit('cancel')">Cancel</button>
        <button class="h-[34px] rounded-[10px] bg-[#2f6b4d] px-4 text-[11px] font-semibold text-white" @click="$emit('save')">Save Purchase</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  open: Boolean,
  form: { type: Object, default: null },
  suppliers: { type: Array, default: () => [] },
})

defineEmits(['cancel', 'save', 'update-supplier', 'update-amount-paid', 'update-item', 'remove-item'])

const money = (value) => `USh ${formatAmount(value)}`
const total = computed(() => props.form?.items?.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.costPrice || 0)), 0) || 0)
const balance = computed(() => Math.max(total.value - Number(props.form?.amountPaid || 0), 0))
</script>
