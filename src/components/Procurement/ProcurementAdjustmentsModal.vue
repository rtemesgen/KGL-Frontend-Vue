<template>
  <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('cancel')">
    <div class="w-full max-w-[760px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#dce8f8] text-[#1f6be8]"><AdjustmentsHorizontalIcon class="h-5 w-5" /></span>
          <h3 class="m-0 text-[18px] font-semibold text-[#0f172a]">Bulk Inventory Adjustments</h3>
        </div>
        <button class="text-[#94a3b8] transition hover:text-[#475569]" @click="$emit('cancel')"><XMarkIcon class="h-6 w-6" /></button>
      </header>

      <div class="space-y-4 p-4">
        <div class="relative">
          <input
            :value="search"
            type="text"
            placeholder="Search and add items by ID or Name..."
            class="h-[40px] w-full rounded-[12px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] outline-none"
            @input="$emit('update-search', $event.target.value)"
          />

          <div
            v-if="showSuggestions"
            class="absolute left-0 right-0 top-[calc(100%+6px)] z-10 overflow-hidden rounded-[12px] border border-[#d8decf] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
          >
            <button
              v-for="item in suggestions"
              :key="item.sku"
              type="button"
              class="flex w-full items-center justify-between gap-3 border-b border-[#eef2ea] px-3 py-2 text-left last:border-b-0 hover:bg-[#f7faf5]"
              @click="$emit('add-item', item)"
            >
              <span>
                <span class="block text-[12px] font-semibold text-[#0f172a]">{{ item.name }}</span>
                <span class="block text-[10px] text-[#64748b]">{{ item.sku }}</span>
              </span>
              <span class="text-[10px] font-semibold text-[#2f6b4d]">Stock {{ item.systemQty }}</span>
            </button>
          </div>
        </div>

        <div class="overflow-hidden rounded-[14px] border border-[#d8decf]">
          <table class="min-w-full border-collapse">
            <thead class="bg-[#eef1e6] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a7f67]">
              <tr>
                <th class="px-3 py-2">Item Details</th>
                <th class="px-3 py-2 text-center">System Stock</th>
                <th class="px-3 py-2 text-center">Physical Count</th>
                <th class="px-3 py-2 text-center">Variance</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id" class="border-t border-[#e3e7da] text-[12px] text-[#0f172a]">
                <td class="px-3 py-3">
                  <div class="font-medium">{{ row.name || 'Add item...' }}</div>
                  <div class="text-[11px] text-[#64748b]">{{ row.sku || '-' }}</div>
                </td>
                <td class="px-3 py-3 text-center text-[#475569]">{{ row.systemQty ?? '-' }}</td>
                <td class="px-3 py-3 text-center">
                  <input
                    :value="row.physicalQty"
                    type="number"
                    min="0"
                    class="h-[34px] w-[100px] rounded-[10px] border border-[#d8decf] bg-white px-3 text-center outline-none"
                    @input="$emit('update-row', row.id, 'physicalQty', $event.target.value)"
                  />
                </td>
                <td class="px-3 py-3 text-center font-semibold" :class="Number(row.variance || 0) < 0 ? 'text-[#dc2626]' : 'text-[#2f6b4d]'">{{ Number(row.variance || 0) > 0 ? '+' : '' }}{{ row.variance || 0 }}</td>
                <td class="px-3 py-3 text-right"><button class="text-[#dc2626]" @click="$emit('remove-row', row.id)"><TrashIcon class="inline h-4 w-4" /></button></td>
              </tr>
              <tr v-if="!rows.length"><td colspan="5" class="px-3 py-5 text-center text-[12px] text-[#64748b]">Search above to add items for adjustment.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-[11px] font-medium text-[#334155]">Reason for Adjustment</span>
            <input :value="reason" type="text" class="h-[38px] w-full rounded-[10px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] outline-none" @input="$emit('update-reason', $event.target.value)" />
          </label>
          <div class="rounded-[10px] border border-[#d8decf] bg-[#f8faf7] px-3 py-2">
            <div class="text-[11px] font-medium text-[#334155]">Recorded By</div>
            <div class="text-[13px] font-semibold text-[#0f172a]">{{ recordedBy }}</div>
          </div>
        </div>
      </div>

      <footer class="flex justify-end gap-2 border-t border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <button class="h-[38px] rounded-[10px] border border-[#d8decf] bg-white px-4 text-[12px] font-semibold text-[#475569]" @click="$emit('cancel')">Cancel</button>
        <button class="h-[38px] rounded-[10px] bg-[#2f6b4d] px-5 text-[12px] font-semibold text-white" @click="$emit('save')">Save Adjustment</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AdjustmentsHorizontalIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  open: Boolean,
  rows: { type: Array, default: () => [] },
  search: { type: String, default: '' },
  reason: { type: String, default: '' },
  recordedBy: { type: String, default: '' },
  suggestions: { type: Array, default: () => [] },
})

defineEmits(['cancel', 'save', 'update-search', 'update-row', 'remove-row', 'update-reason', 'add-item'])

const showSuggestions = computed(() => props.search.trim().length > 0 && props.suggestions.length > 0)
</script>
